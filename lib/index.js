/**
 * dsh-cot-profile — host half.
 *
 * Registers a `cot-profile` session projection that folds reasoning-block and
 * visible-reply statistics out of the `session/event` stream, builds the
 * trajectory indicator vector, and judges the closest profile family. The
 * browser reads the projection value live through `useProjection('cot-profile')`
 * — no polling, no custom RPC; resume/reload is covered by the projection
 * subsystem's checkpoint/restore.
 *
 * Also:
 * - emits `cot-profile/update` (throttled) and `cot-profile/record` (session
 *   end) events for other host plugins;
 * - registers the `cot-profile` settings namespace for configuration
 *   (profiles, weights, thresholds, record sink).
 */
import z from '@deepseek-ai/schemastery';
import { z as zz } from 'zod';
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';
import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { initState, foldEvent, renderView } from './projection.js';
import {
  aggregateGroups,
  baselineDiff,
  groupRecords,
  judgmentDistribution,
  profileFromGroup,
  resolveRecordPath,
} from './calibrate.js';
import { resolveProfiles } from './profiles.js';
import { DEFAULT_WEIGHTS } from './analyzer.js';

export const name = 'cot-profile';

/** Durable settings namespace shared with the browser UI. */
export const SETTINGS_NAMESPACE = settingsNamespace('cot-profile');

/** Session-projection key the browser reads via `useProjection`. */
export const PROJECTION_KEY = 'cot-profile';

/** Require the session store so events only flow once it is mounted. */
const inject = ['sessions'];

const Config = z.object({
  /** Blocks before a verdict is given (the UI shows "sampling" below this). */
  minBlocksForJudgment: z.number().step(1).min(1).max(500).default(3),
  /** Per-dimension weights; empty object = analyzer defaults. */
  weights: z.dict(z.number()).default({}),
  /** User-defined profile families; empty array = built-in baselines. */
  profiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().default(''),
        description: z.string().default(''),
        vector: z.dict(z.number()),
      }),
    )
    .default([]),
  /** Show the session-header badge. */
  badge: z.boolean().default(true),
  /** Show the floating panel. */
  panel: z.boolean().default(true),
  /**
   * Panel container: 'overlay' = floating panel (default, zero risk);
   * 'track' = experimental layout-track right column (direct DOM grid
   * manipulation; a DSH upgrade may require adapting).
   */
  panelMode: z.union(['overlay', 'track']).default('overlay'),
  /** Record-mode: per-session aggregate measurement at session end. */
  record: z
    .object({
      /** Emit a `cot-profile/record` event at session end. */
      emit: z.boolean().default(true),
      /** Optional JSONL file path to append records to ('' = disabled). */
      file: z.string().default(''),
    })
    .default({}),
});

/** Wire payload of the projection (validated with zod before it leaves host). */
const ViewSchema = zz.object({
  v: zz.number().int().min(1),
  blocks: zz.number().int().min(0),
  minBlocks: zz.number().int().min(1),
  counts: zz.object({
    letMe: zz.number(),
    we: zz.number(),
    lets: zz.number(),
    i: zz.number(),
  }),
  firstLines: zz.object({
    'we-need': zz.number(),
    'the-user-wants': zz.number(),
    'let-me': zz.number(),
    i: zz.number(),
    other: zz.number(),
  }),
  p50BlockChars: zz.number(),
  visibleReplies: zz.number(),
  vector: zz.record(zz.number()),
  judgment: zz.object({
    sufficient: zz.boolean(),
    family: zz.string(),
    confidence: zz.number(),
    distances: zz.record(zz.number()),
    mixed: zz.boolean(),
    mixedReason: zz.string(),
  }),
  ui: zz.object({ badge: zz.boolean(), panel: zz.boolean(), panelMode: zz.string(), profilesCount: zz.number() }),
  revision: zz.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Host wiring
// ---------------------------------------------------------------------------

/** Minimal leading/trailing throttle (no timer-service dependency). */
function makeThrottle(fn, delay) {
  let timer = null;
  let lastRun = 0;
  const throttled = () => {
    const now = Date.now();
    const remaining = delay - (now - lastRun);
    if (remaining <= 0) {
      lastRun = now;
      fn();
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        lastRun = Date.now();
        fn();
      }, remaining);
    }
  };
  throttled.dispose = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return throttled;
}

function appendJsonl(file, record) {
  const path = resolveRecordPath(file, homedir());
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`);
}

function apply(ctx, config) {
  const logger = ctx.logger(name);

  let resolveConfig = () => config ?? {};
  const runtime = {
    config: () => Config(resolveConfig() ?? {}),
  };

  installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, config ?? {}, {
    setSource: (next) => {
      resolveConfig = next;
    },
    onChange: () => {
      // Judgment re-derives from the next event fold; nothing to do eagerly.
    },
    validate: (value) => {
      if (!value || value.minBlocksForJudgment < 1) {
        throw new Error('minBlocksForJudgment must be at least 1');
      }
      const ids = new Set();
      for (const profile of value.profiles ?? []) {
        if (!profile.id || !String(profile.id).trim()) {
          throw new Error('every profile needs a non-empty id');
        }
        if (ids.has(profile.id)) throw new Error(`duplicate profile id: ${profile.id}`);
        ids.add(profile.id);
        if (!profile.vector || Object.keys(profile.vector).length === 0) {
          throw new Error(`profile "${profile.id}" needs a non-empty vector`);
        }
      }
    },
  });

  const projections = ctx.get('sessionProjections');

  // GUI calibration: serve aggregated record data to the settings section.
  // Registered before the projections check so calibration works even without
  // the projection registry. Reads only the configured record.file path and
  // returns aggregates (never raw reasoning text). The web server may mount
  // after this plugin, so wait for the service via ctx.inject.
  let disposeRoute = () => {};
  ctx.inject(['webServer'], (webCtx) => {
    const server = webCtx.get('webServer');
    if (server === undefined) return undefined;
    disposeRoute = server.register({
      kind: 'exact',
      path: '/cot-profile/records',
      handler: (_req, res) => {
        try {
          const configured = runtime.config().record.file;
          const file = resolveRecordPath(configured, homedir());
          let records = [];
          if (file && existsSync(file)) {
            const text = readFileSync(file, 'utf8');
            for (const line of text.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                records.push(JSON.parse(trimmed));
              } catch {
                // skip malformed lines
              }
            }
          }
          const configNow = runtime.config();
          const profiles = resolveProfiles(configNow.profiles);
          const weights = { ...DEFAULT_WEIGHTS, ...configNow.weights };
          const rawGroups = groupRecords(records);
          const groups = aggregateGroups(rawGroups).map((group, i) => ({
            ...group,
            judgmentDist: judgmentDistribution(rawGroups[i].records),
            baseline: baselineDiff(group.vector, profiles, weights),
            profile: profileFromGroup(group),
          }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              file: configured || null,
              exists: !configured || (file !== '' && existsSync(file)),
              total: records.length,
              groups,
            }),
          );
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        }
      },
    });
    return () => {
      disposeRoute();
      disposeRoute = () => {};
    };
  });

  if (projections === undefined) {
    logger.warn('sessionProjections registry unavailable; cot-profile will not compute anything');
    return;
  }

  /** sessionId -> { startedAt, preset, provider, model } (record metadata). */
  const metadata = new Map();
  /** sessionId -> { value, seq } (latest projection view, for records). */
  const lastView = new Map();
  /** sessionId -> throttled emit fn. */
  const throttled = new Map();

  const cleanupSession = (id) => {
    const t = throttled.get(id);
    if (t && typeof t.dispose === 'function') t.dispose();
    throttled.delete(id);
    lastView.delete(id);
    metadata.delete(id);
  };

  ctx.on('session/created', (session) => {
    const m = metadata.get(session.id) ?? {};
    m.startedAt = Date.now();
    metadata.set(session.id, m);
  });

  ctx.on('agent-preset/selected', (sessionId, agentPreset) => {
    const m = metadata.get(sessionId) ?? {};
    m.preset = agentPreset;
    metadata.set(sessionId, m);
  });

  // Capture provider/model from the frozen per-step call config. Must keep the
  // waterfall moving — next() is called exactly once and its result returned.
  ctx.on('agent/request', async (payload, next) => {
    const callConfig = await next();
    try {
      const agent = payload?.agent;
      const id = agent?.id ?? agent?.sessionId;
      if (id && callConfig) {
        const m = metadata.get(id) ?? {};
        m.provider = callConfig.provider ?? m.provider;
        m.model = callConfig.model ?? m.model;
        metadata.set(id, m);
      }
    } catch (err) {
      logger.warn('failed to capture model metadata: %o', err);
    }
    return callConfig;
  });

  const disposeRegister = projections.register({
    key: PROJECTION_KEY,
    schema: ViewSchema,
    stateVersion: 1,
    init: initState,
    apply: foldEvent,
    view: (state) => renderView(state, runtime.config()),
  });

  const disposeListen = projections.onChanged((session, key, value, seq) => {
    if (key !== PROJECTION_KEY) return;
    const id = session.id;
    lastView.set(id, { value, seq });
    let emit = throttled.get(id);
    if (!emit) {
      emit = makeThrottle(() => {
        const entry = lastView.get(id);
        if (entry) {
          ctx.emit('cot-profile/update', { sessionId: id, ...entry.value, seq: entry.seq });
        }
      }, 500);
      throttled.set(id, emit);
    }
    emit();
  });

  /**
   * Emit + append one aggregate record for a session. Called at every
   * turn/end (cumulative snapshot, final: false) and at session/disposed
   * (final: true). DSH sessions rarely get disposed, so turn-level snapshots
   * are what actually lands on disk in normal use.
   */
  const writeRecord = (id, extra) => {
    const entry = lastView.get(id);
    const meta = metadata.get(id) ?? {};
    if (!entry || !entry.value || entry.value.blocks === 0) return;
    const record = {
      v: 1,
      sessionId: id,
      startedAt: meta.startedAt ?? null,
      endedAt: Date.now(),
      preset: meta.preset ?? null,
      provider: meta.provider ?? null,
      model: meta.model ?? null,
      turn: extra.turn ?? null,
      final: extra.final === true,
      reasoningBlocks: entry.value.blocks,
      indicators: {
        letMe: entry.value.counts.letMe,
        we: entry.value.counts.we,
        lets: entry.value.counts.lets,
        i: entry.value.counts.i,
        p50BlockChars: entry.value.p50BlockChars,
        visibleReplies: entry.value.visibleReplies,
        firstLines: entry.value.firstLines,
      },
      vector: entry.value.vector,
      judgment: entry.value.judgment,
    };
    const recordConfig = runtime.config().record;
    if (recordConfig.emit) ctx.emit('cot-profile/record', record);
    if (recordConfig.file) {
      try {
        appendJsonl(recordConfig.file, record);
      } catch (err) {
        logger.warn('cot-profile record write failed (%s): %o', recordConfig.file, err);
      }
    }
  };

  // Turn-level snapshots: the primary record source (sessions rarely dispose).
  ctx.on('session/event', (session, event) => {
    if (event.type !== 'turn/end') return;
    const { turn } = event.data ?? {};
    if (typeof turn !== 'number') return;
    writeRecord(session.id, { turn, final: false });
  });

  ctx.on('session/disposed', (session) => {
    writeRecord(session.id, { final: true });
    cleanupSession(session.id);
  });

  ctx.effect(() => () => {
    disposeRegister();
    disposeListen();
    disposeRoute();
    for (const t of throttled.values()) {
      if (typeof t.dispose === 'function') t.dispose();
    }
    throttled.clear();
    lastView.clear();
    metadata.clear();
  });
}

export { Config, apply, inject, ViewSchema };
