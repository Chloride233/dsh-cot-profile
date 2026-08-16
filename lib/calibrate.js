/**
 * dsh-cot-profile — record aggregation for GUI calibration.
 *
 * Pure, zero-dependency functions: group raw `cot-profile/record` entries by
 * (provider, model, preset), aggregate their indicator vectors (per-dimension
 * mean over the group), and synthesize profile-family candidates the settings
 * UI can apply with one click.
 *
 * Semi-automatic by design: aggregation is automatic, applying a candidate is
 * a human decision (the settings UI writes it into `profiles` config, never
 * silently into the built-in baselines).
 */
import { distance, DEFAULT_WEIGHTS, MIXED_DEFAULTS } from './analyzer.js';

/** Vector dims aggregated per group (mirrors buildVector's output keys). */
export const VECTOR_DIMS = [
  'letMe100',
  'we100',
  'lets100',
  'i100',
  'firstLineWeNeed',
  'firstLineUserWants',
  'firstLineLetMe',
  'firstLineI',
  'firstLineOther',
  'p50BlockChars',
  'visibleReplies100',
];

/** Stable group key: provider | model | preset (unknowns tolerated). */
export function groupKey(record) {
  return [record.provider || '(unknown provider)', record.model || '(unknown model)', record.preset || '(default preset)'].join('|');
}

/**
 * Resolve a configured record-file path. Node's fs never expands `~`, so the
 * leading tilde (the most natural way users write home-relative paths) is
 * expanded here. Absolute and relative paths pass through unchanged; an empty
 * string stays empty (recording off).
 *
 * @param file - configured path ('' disables file recording).
 * @param home - the user's home directory (injectable for tests).
 */
export function resolveRecordPath(file, home) {
  if (!file) return '';
  if (file === '~') return home;
  if (file.startsWith('~/')) return `${home}/${file.slice(2)}`;
  return file;
}

/** Group records by (provider, model, preset), preserving first-seen order. */
export function groupRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = groupKey(record);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        provider: record.provider ?? null,
        model: record.model ?? null,
        preset: record.preset ?? null,
        records: [],
      };
      groups.set(key, group);
    }
    group.records.push(record);
  }
  return [...groups.values()];
}

/** Per-group mean vector plus sample count and total reasoning blocks. */
export function aggregateGroups(groups) {
  return groups.map((group) => {
    const vector = {};
    for (const dim of VECTOR_DIMS) {
      let sum = 0;
      let n = 0;
      for (const record of group.records) {
        const value = record.vector?.[dim];
        if (typeof value === 'number' && Number.isFinite(value)) {
          sum += value;
          n += 1;
        }
      }
      vector[dim] = n > 0 ? Math.round((sum / n) * 1000) / 1000 : 0;
    }
    return {
      key: group.key,
      provider: group.provider,
      model: group.model,
      preset: group.preset,
      count: group.records.length,
      blocks: group.records.reduce((sum, r) => sum + (r.reasoningBlocks || 0), 0),
      vector,
    };
  });
}

/** One-stop aggregation over raw records. */
export function aggregateRecords(records) {
  return aggregateGroups(groupRecords(records));
}

/** Derive a stable profile id from a group's model or preset label. */
export function profileIdFromGroup(group) {
  const base = String(group.model || group.preset || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'custom'}-like`;
}

/** A profile-family candidate ready to write into the `profiles` config. */
export function profileFromGroup(group) {
  const model = group.model || '(unknown model)';
  const preset = group.preset ? ` under preset ${group.preset}` : '';
  return {
    id: profileIdFromGroup(group),
    name: `${model} (measured)`,
    description: `Calibrated from ${group.count} session record(s)${preset}.`,
    vector: { ...group.vector },
  };
}

/** Map a record's judgment to a coarse trajectory-side bucket. */
function bucketOf(record) {
  const j = record.judgment ?? {};
  if (j.mixed) return 'mixed';
  if (j.family === 'minimal-like') return 'spec';
  if (j.family === 'standard-like') return 'react';
  if (j.family === 'gray-like') return 'gray';
  return 'sampling';
}

/**
 * Distribution of the group's session judgments across trajectory sides —
 * the confidence evidence behind the group's aggregate vector.
 */
export function judgmentDistribution(records) {
  const dist = { spec: 0, react: 0, gray: 0, mixed: 0, sampling: 0 };
  for (const record of records) {
    dist[bucketOf(record)] += 1;
  }
  return dist;
}

/**
 * Signed per-dimension relative difference between a group's mean vector and
 * its closest current baseline profile: (observed − baseline) / (|baseline| + 1).
 * Positive means the group measures ABOVE the baseline on that dimension.
 * Also returns the matched profile id and the weighted distance used for the
 * match (consistent with the judgment algorithm).
 *
 * @param weights - per-dimension weights; {} uses analyzer defaults.
 */
export function baselineDiff(vector, profiles, weights = {}) {
  const merged = { ...DEFAULT_WEIGHTS, ...weights };
  let best = null;
  let bestDist = Infinity;
  for (const profile of profiles) {
    const d = distance(vector, profile.vector, merged);
    if (d < bestDist) {
      bestDist = d;
      best = profile;
    }
  }
  if (!best) return { profileId: null, distance: null, diffs: {} };

  // Strong directional override, consistent with judge(): a runaway
  // we/letMe count with overwhelming dominance selects the directional side
  // even when another baseline is nearest (e.g. gray's high-I baseline pulls
  // the nearest match sideways).
  const letMe100 = vector.letMe100 ?? 0;
  const we100 = vector.we100 ?? 0;
  const dirTotal = letMe100 + we100;
  const reactFrac = dirTotal > 0 ? letMe100 / dirTotal : 0;
  const specFrac = dirTotal > 0 ? we100 / dirTotal : 0;
  const strongReact = reactFrac >= MIXED_DEFAULTS.strongFraction && letMe100 >= MIXED_DEFAULTS.strongSignalMin;
  const strongSpec = specFrac >= MIXED_DEFAULTS.strongFraction && we100 >= MIXED_DEFAULTS.strongSignalMin;
  const targetId = strongReact ? 'standard-like' : strongSpec ? 'minimal-like' : null;
  const target = targetId ? profiles.find((p) => p.id === targetId) : null;
  const chosen = target ?? best;
  const dist = target ? distance(vector, chosen.vector, merged) : bestDist;

  const diffs = {};
  for (const dim of Object.keys(chosen.vector)) {
    const obs = vector[dim] ?? 0;
    const base = chosen.vector[dim] ?? 0;
    diffs[dim] = Math.round(((obs - base) / (Math.abs(base) + 1)) * 1000) / 1000;
  }
  return { profileId: chosen.id, distance: Math.round(dist * 1000) / 1000, diffs };
}
