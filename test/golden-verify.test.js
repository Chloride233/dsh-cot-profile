import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildVector, judge } from '../lib/analyzer.js';
import { resolveProfiles } from '../lib/profiles.js';

/**
 * Golden verification against REAL model probe data.
 *
 * Data source: yjh051108/dsh-router-standard (MIT) `probe/results/*.json` —
 * 119 real DeepSeek V4 Pro / V4 Flash single-request runs, each with a
 * ground-truth lexicon classification (minimal-like / standard-like /
 * ambiguous) and the same wording metrics this plugin uses (we, let me,
 * let's, I, chars, first token). See test/golden/NOTICE.
 *
 * Mapping: probe 'minimal-like' (We voice) ↔ our spec-side family
 * 'minimal-like'; 'standard-like' (Let/The voice) ↔ 'standard-like';
 * 'ambiguous' ↔ our transition band ('mixed'). Single-block runs carry
 * little signal, so a conservative 'mixed' verdict is acceptable for
 * react-side and ambiguous truths; hard direction errors (spec↔react swap)
 * are not.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEIGHTS = {
  letMe100: 3,
  we100: 3,
  lets100: 2,
  i100: 1.5,
  firstLineWeNeed: 1.5,
  firstLineUserWants: 1,
  firstLineLetMe: 1.5,
  firstLineI: 1,
  firstLineOther: 0.5,
  p50BlockChars: 1,
  visibleReplies100: 1.5,
};

const firstLineOf = (tok) => ({ We: 'we-need', The: 'the-user-wants', Let: 'let-me', I: 'i' }[tok] ?? 'other');

function loadRows() {
  const csv = readFileSync(join(__dirname, 'golden', 'probes.csv'), 'utf8').trim().split('\n');
  const [header, ...body] = csv;
  const cols = header.split(',');
  return body.map((line) => {
    const cell = line.split(',');
    const row = {};
    cols.forEach((c, i) => {
      row[c] = Number.isNaN(Number(cell[i])) ? cell[i] : Number(cell[i]);
    });
    return row;
  });
}

function classify(row) {
  const fl = { 'we-need': 0, 'the-user-wants': 0, 'let-me': 0, i: 0, other: 0 };
  fl[firstLineOf(row.firstToken)] += 1;
  const stats = {
    blocks: 1,
    lengths: [row.chars ?? 0],
    counts: { letMe: row.letMe ?? 0, we: row.we ?? 0, lets: row.lets ?? 0, i: row.i ?? 0 },
    firstLines: fl,
    visibleReplies: 0,
  };
  const out = judge(buildVector(stats), 1, resolveProfiles([]), WEIGHTS, 1);
  return out.mixed ? 'mixed' : out.family;
}

test('golden: probe minimal-like runs are never judged react-side (no direction error)', () => {
  const rows = loadRows().filter((r) => r.truth === 'minimal-like');
  assert.ok(rows.length >= 50, `expected a substantial spec-side sample, got ${rows.length}`);
  for (const row of rows) {
    const family = classify(row);
    assert.notEqual(family, 'standard-like', `${row.id} (${row.model}) misjudged as react-side`);
  }
});

test('golden: spec-side discrimination is high (>= 90%)', () => {
  const rows = loadRows().filter((r) => r.truth === 'minimal-like');
  const spec = rows.filter((r) => classify(r) === 'minimal-like').length;
  const rate = spec / rows.length;
  assert.ok(rate >= 0.9, `spec-side discrimination ${(rate * 100).toFixed(1)}% < 90%`);
});

test('golden: probe standard-like runs are never judged spec-side', () => {
  const rows = loadRows().filter((r) => r.truth === 'standard-like');
  assert.ok(rows.length > 0, 'expected react-side samples');
  for (const row of rows) {
    assert.notEqual(classify(row), 'minimal-like', `${row.id} misjudged as spec-side`);
  }
});

test('golden: ambiguous runs are mostly flagged as the transition band (>= 55%)', () => {
  const rows = loadRows().filter((r) => r.truth === 'ambiguous');
  const mixed = rows.filter((r) => classify(r) === 'mixed').length;
  const rate = mixed / rows.length;
  assert.ok(rate >= 0.55, `transition-band detection ${(rate * 100).toFixed(1)}% < 55%`);
});

test('golden: zero direction errors overall', () => {
  for (const row of loadRows()) {
    const family = classify(row);
    if (row.truth === 'minimal-like') assert.notEqual(family, 'standard-like', `${row.id}`);
    if (row.truth === 'standard-like') assert.notEqual(family, 'minimal-like', `${row.id}`);
  }
});
