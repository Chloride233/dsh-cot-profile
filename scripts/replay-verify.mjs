#!/usr/bin/env node
/**
 * End-to-end replay verification for dsh-cot-profile.
 *
 * Replays a real DSH session log (session.jsonl[.zstd]) through the plugin's
 * projection fold and cross-checks the resulting statistics against an
 * INDEPENDENT ground-truth tally over the raw reasoning block texts. This
 * verifies the monitoring chain (event stream -> fold -> stats) has no
 * dropped or miscounted blocks — the layer unit tests cannot cover.
 *
 * Ground truth is deliberately computed by a separate, simpler path:
 *   - blocks / lengths / counts / firstLines: counted directly from every
 *     `assistant/chunk` block-end reasoning text (no turn/step bookkeeping)
 *   - visibleReplies: raw `assistant/message` count and turn count reported
 *     for comparison (the fold derives interim = messages − turns)
 *
 * Usage: node scripts/replay-verify.mjs <path-to-session.jsonl[.zstd]>
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { initState, foldEvent, renderView } from '../lib/projection.js';
import { countPhrases, classifyFirstLine, tokenize, median } from '../lib/analyzer.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/replay-verify.mjs <session.jsonl[.zstd]>');
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

const events = [];
for (const line of readLines(file)) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  try {
    events.push(JSON.parse(trimmed));
  } catch {
    // skip non-JSON lines
  }
}
events.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

// ---- replay through the projection fold ----
let state = initState();
for (const event of events) {
  state = foldEvent(state, event);
}
const view = renderView(state, {
  minBlocksForJudgment: 10,
  weights: {},
  profiles: [],
  badge: true,
  panel: true,
  panelMode: 'overlay',
});

// ---- independent ground truth ----
const truth = {
  blocks: 0,
  lengths: [],
  counts: { letMe: 0, we: 0, lets: 0, i: 0 },
  firstLines: { 'we-need': 0, 'the-user-wants': 0, 'let-me': 0, i: 0, other: 0 },
};
let assistantMessages = 0;
let turns = 0;
let blockStarts = 0;
let blockEnds = 0;
let pendingKeys = 0;
for (const event of events) {
  if (event.type === 'assistant/chunk') {
    const { turn, step, chunk } = event.data ?? {};
    const key = `${turn}\u0000${step}\u0000${chunk?.index}`;
    if (chunk?.type === 'block-start') blockStarts += 1;
    else if (chunk?.type === 'block-end') {
      blockEnds += 1;
      // Only reasoning blocks are monitored by the fold — tool-call and text
      // blocks must be excluded from the ground truth too.
      if (chunk.block?.type !== 'reasoning') continue;
      const text = chunk.block?.text;
      if (typeof text === 'string' && text.length > 0) {
        truth.blocks += 1;
        truth.lengths.push(text.length);
        const counts = countPhrases(tokenize(text));
        truth.counts.letMe += counts.letMe;
        truth.counts.we += counts.we;
        truth.counts.lets += counts.lets;
        truth.counts.i += counts.i;
        truth.firstLines[classifyFirstLine(text)] += 1;
      }
    }
  } else if (event.type === 'assistant/message') {
    assistantMessages += 1;
  } else if (event.type === 'turn/end') {
    turns += 1;
  }
}

// ---- comparison ----
const pad = (a, b) => `${String(a).padEnd(10)} | ${String(b)}`;
const problems = [];
if (view.blocks !== truth.blocks) problems.push(`blocks: fold=${view.blocks} truth=${truth.blocks}`);
if (view.counts.letMe !== truth.counts.letMe) problems.push(`letMe: fold=${view.counts.letMe} truth=${truth.counts.letMe}`);
if (view.counts.we !== truth.counts.we) problems.push(`we: fold=${view.counts.we} truth=${truth.counts.we}`);
if (view.counts.lets !== truth.counts.lets) problems.push(`lets: fold=${view.counts.lets} truth=${truth.counts.lets}`);
if (view.counts.i !== truth.counts.i) problems.push(`i: fold=${view.counts.i} truth=${truth.counts.i}`);
for (const k of Object.keys(truth.firstLines)) {
  if (view.firstLines[k] !== truth.firstLines[k]) problems.push(`firstLine.${k}: fold=${view.firstLines[k]} truth=${truth.firstLines[k]}`);
}
if (view.p50BlockChars !== median(truth.lengths)) problems.push('p50 mismatch');

console.log('=== dsh-cot-profile replay verification ===');
console.log('session:', file);
console.log('events:', events.length, '| block-start:', blockStarts, '| block-end:', blockEnds, '| assistant/message:', assistantMessages, '| turns:', turns);
console.log();
console.log('metric'.padEnd(20), 'fold'.padEnd(12), 'ground-truth');
console.log('-'.repeat(44));
console.log('blocks'.padEnd(20), pad(view.blocks, truth.blocks));
console.log('we'.padEnd(20), pad(view.counts.we, truth.counts.we));
console.log('letMe'.padEnd(20), pad(view.counts.letMe, truth.counts.letMe));
console.log("let's".padEnd(20), pad(view.counts.lets, truth.counts.lets));
console.log('i'.padEnd(20), pad(view.counts.i, truth.counts.i));
for (const k of Object.keys(truth.firstLines)) {
  console.log(`firstLine:${k}`.padEnd(20), pad(view.firstLines[k], truth.firstLines[k]));
}
console.log('p50BlockChars'.padEnd(20), pad(view.p50BlockChars, median(truth.lengths)));
console.log('visibleReplies (fold interim)'.padEnd(20), String(view.visibleReplies));
console.log('messages − turns (expected interim)'.padEnd(20), String(Math.max(0, assistantMessages - turns)));
console.log(
  '  (gap = messages of the still-open tail turn; live sessions are expected to show a small gap)'.padEnd(20),
);
console.log();
if (problems.length === 0) {
  console.log('RESULT: PASS — monitoring statistics match the ground truth exactly.');
} else {
  console.log('RESULT: FAIL');
  for (const p of problems) console.log('  -', p);
  process.exitCode = 1;
}
