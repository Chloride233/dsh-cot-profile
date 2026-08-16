import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenize,
  countPhrases,
  classifyFirstLine,
  median,
  buildVector,
  dimensionScore,
  distance,
  judge,
  DEFAULT_WEIGHTS,
} from '../lib/analyzer.js';
import { BUILTIN_PROFILES, resolveProfiles } from '../lib/profiles.js';

test('tokenize keeps apostrophes and lowercases', () => {
  assert.deepEqual(tokenize("Let's check I'm fine."), ["let's", 'check', "i'm", 'fine']);
  assert.deepEqual(tokenize("We’ll see"), ['we’ll'.replace('’', "'"), 'see']);
});

test('countPhrases counts the four signature phrases with boundaries', () => {
  const text = "Let me think. We need to move. Let's go. I think I'll do it. let me also mention we.";
  const counts = countPhrases(tokenize(text));
  assert.equal(counts.letMe, 2);
  assert.equal(counts.we, 2);
  assert.equal(counts.lets, 1);
  assert.equal(counts.i, 2); // I + I'll
});

test('countPhrases does not match substrings (boundary by construction)', () => {
  const counts = countPhrases(tokenize('window letter internet weep'));
  assert.deepEqual(counts, { letMe: 0, we: 0, lets: 0, i: 0 });
});

test('classifyFirstLine classes research first-line patterns', () => {
  assert.equal(classifyFirstLine('We need modify the build first.'), 'we-need');
  assert.equal(classifyFirstLine('The user wants a quick fix.'), 'the-user-wants');
  assert.equal(classifyFirstLine('Let me check the logs.'), 'let-me');
  assert.equal(classifyFirstLine("I'm going to inspect the stack."), 'i');
  assert.equal(classifyFirstLine('Running tests now...'), 'other');
  assert.equal(classifyFirstLine('**We need to be careful**'), 'we-need'); // markdown strip
});

test('median works for even and odd lengths', () => {
  assert.equal(median([]), 0);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), Math.round(2.5));
});

test('buildVector normalizes counts per 100 blocks and first lines to proportions', () => {
  const stats = {
    blocks: 2,
    lengths: [100, 200],
    counts: { letMe: 1, we: 3, lets: 0, i: 1 },
    firstLines: { 'we-need': 1, 'the-user-wants': 0, 'let-me': 0, i: 1, other: 0 },
    visibleReplies: 1,
  };
  const v = buildVector(stats);
  assert.equal(v.letMe100, 50);
  assert.equal(v.we100, 150);
  assert.equal(v.p50BlockChars, 150);
  assert.equal(v.firstLineWeNeed, 0.5);
  assert.equal(v.firstLineI, 0.5);
});

test('dimensionScore is bounded in [0,1) and zero on equality', () => {
  assert.equal(dimensionScore(5, 5), 0);
  assert.equal(dimensionScore(0, 0), 0);
  const s = dimensionScore(208, 0.2);
  assert.ok(s >= 0 && s < 1);
  assert.ok(dimensionScore(1000, 0) < 1);
});

test('distance is normalized by weight sum', () => {
  const base = { a: 10, b: 20 };
  assert.equal(distance({ a: 10, b: 20 }, base, DEFAULT_WEIGHTS), 0);
  const weights = { a: 1, b: 1 };
  const d = distance({ a: 0, b: 0 }, base, weights);
  assert.ok(d > 0 && d < 1);
});

test('judge refuses below minBlocks', () => {
  const profiles = resolveProfiles([]);
  const v = buildVector({
    blocks: 3,
    lengths: [100, 100, 100],
    counts: { letMe: 0, we: 9, lets: 3, i: 0 },
    firstLines: { 'we-need': 3, 'the-user-wants': 0, 'let-me': 0, i: 0, other: 0 },
    visibleReplies: 1,
  });
  const out = judge(v, 3, profiles, DEFAULT_WEIGHTS, 10);
  assert.deepEqual(out, { sufficient: false });
});

test('judge picks minimal-like for a we-heavy, let-me-free vector', () => {
  const profiles = resolveProfiles([]);
  const v = buildVector({
    blocks: 40,
    lengths: Array(40).fill(180),
    counts: { letMe: 0, we: 60, lets: 24, i: 4 },
    firstLines: { 'we-need': 24, 'the-user-wants': 0, 'let-me': 0, i: 1, other: 15 },
    visibleReplies: 1,
  });
  const out = judge(v, 40, profiles, DEFAULT_WEIGHTS, 10);
  assert.equal(out.sufficient, true);
  assert.equal(out.family, 'minimal-like');
  assert.equal(out.mixed, false);
  assert.ok(out.confidence > 0.6);
});

test('judge flags the transition band when both we and let me are elevated', () => {
  const profiles = resolveProfiles([]);
  const v = buildVector({
    blocks: 40,
    lengths: Array(40).fill(300),
    counts: { letMe: 40, we: 40, lets: 8, i: 40 },
    firstLines: { 'we-need': 10, 'the-user-wants': 10, 'let-me': 10, i: 5, other: 5 },
    visibleReplies: 8,
  });
  const out = judge(v, 40, profiles, DEFAULT_WEIGHTS, 10);
  assert.equal(out.sufficient, true);
  assert.equal(out.mixed, true);
  assert.equal(out.mixedReason, 'dual-indicator');
  assert.equal(out.family, '');
});

test('judge flags the transition band on low confidence', () => {
  const profiles = resolveProfiles([]);
  // Neutral vector below both dual-indicator bars but equidistant from every
  // baseline → low confidence (not the dual-indicator case).
  const v = buildVector({
    blocks: 40,
    lengths: Array(40).fill(350),
    counts: { letMe: 4, we: 8, lets: 4, i: 20 },
    firstLines: { 'we-need': 8, 'the-user-wants': 8, 'let-me': 8, i: 8, other: 8 },
    visibleReplies: 12,
  });
  const out = judge(v, 40, profiles, DEFAULT_WEIGHTS, 10);
  assert.equal(out.sufficient, true);
  assert.equal(out.mixed, true);
  assert.equal(out.mixedReason, 'low-confidence');
  assert.equal(out.family, '');
});

test('judge picks standard-like for a let-me-heavy vector', () => {
  const profiles = resolveProfiles([]);
  const v = buildVector({
    blocks: 40,
    lengths: Array(40).fill(480),
    counts: { letMe: 80, we: 5, lets: 0, i: 80 },
    firstLines: { 'we-need': 2, 'the-user-wants': 18, 'let-me': 12, i: 4, other: 4 },
    visibleReplies: 18,
  });
  const out = judge(v, 40, profiles, DEFAULT_WEIGHTS, 10);
  assert.equal(out.sufficient, true);
  assert.equal(out.family, 'standard-like');
  assert.equal(out.mixed, false);
  assert.ok(out.confidence > 0.6);
});

test('built-in profiles all carry the full dimension set', () => {
  const dims = Object.keys(DEFAULT_WEIGHTS);
  for (const profile of BUILTIN_PROFILES) {
    assert.ok(profile.id, 'profile id present');
    for (const dim of dims) {
      assert.equal(typeof profile.vector[dim], 'number', `${profile.id}.${dim}`);
    }
  }
});

test('resolveProfiles falls back to built-ins', () => {
  assert.equal(resolveProfiles(undefined), BUILTIN_PROFILES);
  assert.equal(resolveProfiles([]), BUILTIN_PROFILES);
  const custom = [{ id: 'x', name: 'X', description: '', vector: { a: 1 } }];
  assert.equal(resolveProfiles(custom), custom);
});

test('judge treats a runaway let-me count as confident react, not mixed', () => {
  const profiles = resolveProfiles([]);
  // ex2r2-A style: 159 let me / 10 blocks, 1 we
  const v = buildVector({
    blocks: 10,
    lengths: Array(10).fill(200),
    counts: { letMe: 159, we: 1, lets: 0, i: 129 },
    firstLines: { 'we-need': 0, 'the-user-wants': 0, 'let-me': 5, i: 0, other: 5 },
    visibleReplies: 0,
  });
  const out = judge(v, 10, profiles, DEFAULT_WEIGHTS, 3);
  assert.equal(out.sufficient, true);
  assert.equal(out.mixed, false);
  assert.equal(out.family, 'standard-like');
  assert.ok(out.confidence >= 0.85);
});

test('judge treats a runaway we count as confident spec, not mixed', () => {
  const profiles = resolveProfiles([]);
  const v = buildVector({
    blocks: 10,
    lengths: Array(10).fill(150),
    counts: { letMe: 0, we: 50, lets: 20, i: 0 },
    firstLines: { 'we-need': 8, 'the-user-wants': 0, 'let-me': 0, i: 0, other: 2 },
    visibleReplies: 0,
  });
  const out = judge(v, 10, profiles, DEFAULT_WEIGHTS, 3);
  assert.equal(out.mixed, false);
  assert.equal(out.family, 'minimal-like');
  assert.ok(out.confidence >= 0.85);
});
