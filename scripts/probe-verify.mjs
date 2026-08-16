#!/usr/bin/env node
/**
 * Controlled-probe verification for dsh-cot-profile.
 *
 * Verifies the plugin's judgment against KNOWN assemblies: run short
 * micro-task sessions under a known trajectory side (spec / react / mixed),
 * then feed their session logs here. The script replays each log through the
 * projection fold, produces the plugin's verdict, and compares it with the
 * expected side.
 *
 * Judgment criteria (consistent with the golden verification):
 *   - expect spec  → judging spec-like is a hit; mixed/other is conservative
 *                    (acceptable); judging react-like is a DIRECTION ERROR
 *   - expect react → symmetric
 *   - expect mixed → judging the transition band is a hit; anything else is
 *                    a miss
 *
 * Usage:
 *   node scripts/probe-verify.mjs --expect spec [session.jsonl[.zstd] ...]
 *   node scripts/probe-verify.mjs --expect react --dir ~/.dsh/sessions/probes
 *
 * Probe workflow (see README 'Controlled probes'):
 *   1. install a probe preset (spec persona / react persona) or use any
 *      known assembly; run one micro-task session per probe
 *   2. export the session logs (the harness persists them under
 *      $DSH_HOME/sessions/<workspace>/<session>/session.jsonl.zstd)
 *   3. run this script with the matching --expect per group of sessions
 *
 * Exit code: 1 when any direction error is found, 0 otherwise.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { initState, foldEvent, renderView } from '../lib/projection.js';

const EXPECTED = new Set(['spec', 'react', 'mixed']);
const args = process.argv.slice(2);
const expectIndex = args.indexOf('--expect');
let expect = null;
let dir = null;
const sessions = [];

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--expect') {
    expect = args[i + 1];
    i += 1;
  } else if (args[i] === '--dir') {
    dir = args[i + 1];
    i += 1;
  } else {
    sessions.push(args[i]);
  }
}

if (!expect || !EXPECTED.has(expect) || (sessions.length === 0 && !dir)) {
  console.error('usage: node scripts/probe-verify.mjs --expect spec|react|mixed <session...> [--dir <dir>]');
  process.exit(2);
}

function readLines(path) {
  if (path.endsWith('.zstd')) {
    const out = spawnSync('zstd', ['-dc', path], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if (out.status !== 0) throw new Error(`zstd failed: ${out.stderr}`);
    return out.stdout.split('\n');
  }
  return readFileSync(path, 'utf8').split('\n');
}

function collectFiles() {
  const files = [...sessions];
  if (dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isFile() && (full.endsWith('.jsonl') || full.endsWith('.zstd'))) files.push(full);
    }
  }
  return files;
}

function verdictOf(path) {
  let state = initState();
  for (const line of readLines(path)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      state = foldEvent(state, JSON.parse(trimmed));
    } catch {
      // skip non-JSON lines
    }
  }
  const view = renderView(state, {
    minBlocksForJudgment: 3,
    weights: {},
    profiles: [],
    badge: true,
    panel: true,
    panelMode: 'overlay',
  });
  const j = view.judgment;
  if (j.mixed) return { side: 'mixed', family: '', confidence: j.confidence, blocks: view.blocks };
  if (j.family === 'minimal-like') return { side: 'spec', family: j.family, confidence: j.confidence, blocks: view.blocks };
  if (j.family === 'standard-like') return { side: 'react', family: j.family, confidence: j.confidence, blocks: view.blocks };
  return { side: 'other', family: j.family || '(sampling)', confidence: j.confidence, blocks: view.blocks };
}

const verdicts = collectFiles().map((file) => ({ file, ...verdictOf(file) }));

const hits = [];
const conservative = [];
const directionErrors = [];
const misses = [];
for (const v of verdicts) {
  if (v.side === expect) hits.push(v);
  else if (expect === 'mixed' || v.side === 'mixed' || v.side === 'other') {
    // For spec/react expectations, a transition-band or sampling verdict is
    // conservative (data-insufficient), not a direction error.
    conservative.push(v);
  } else {
    directionErrors.push(v);
  }
  if (expect === 'mixed' && v.side !== 'mixed') misses.push(v);
}

console.log(`=== dsh-cot-profile probe verification (expect: ${expect}) ===`);
for (const v of verdicts) {
  const tag = v.side === expect ? 'HIT' : v.side === 'mixed' || v.side === 'other' ? 'conservative' : 'DIRECTION-ERROR';
  console.log(
    `${tag.padEnd(16)} ${v.side.padEnd(6)} conf=${String(v.confidence).padEnd(5)} blocks=${String(v.blocks).padEnd(4)} ${v.file}`,
  );
}
console.log('-'.repeat(60));
console.log(`hits: ${hits.length} | conservative: ${conservative.length} | direction errors: ${directionErrors.length}`);
if (expect === 'mixed') console.log(`misses (judged a hard side): ${misses.length}`);

if (directionErrors.length > 0) {
  console.log('\nRESULT: FAIL — direction errors found');
  process.exitCode = 1;
} else if (expect === 'mixed' && hits.length === 0) {
  console.log('\nRESULT: FAIL — no mixed verdicts at all');
  process.exitCode = 1;
} else {
  console.log(`\nRESULT: PASS — no direction errors (${hits.length} hits / ${verdicts.length})`);
}
