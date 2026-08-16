import test from 'node:test';
import assert from 'node:assert/strict';
import { groupRecords, aggregateRecords, profileFromGroup, profileIdFromGroup, resolveRecordPath, judgmentDistribution, baselineDiff, VECTOR_DIMS } from '../lib/calibrate.js';

const BASE_VECTOR = { letMe100: 0, we100: 126, lets100: 60, i100: 10, p50BlockChars: 182, visibleReplies100: 0.5 };

function record(overrides) {
  return {
    v: 1,
    sessionId: 's-' + Math.random().toString(36).slice(2),
    startedAt: 1720000000000,
    endedAt: 1720000100000,
    preset: 'minimal',
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    reasoningBlocks: 100,
    vector: { ...BASE_VECTOR },
    ...overrides,
  };
}

const withWe = (we100) => record({ vector: { ...BASE_VECTOR, we100 } });

test('groupRecords groups by provider|model|preset and tolerates unknowns', () => {
  const groups = groupRecords([
    record({}),
    record({}),
    record({ model: 'deepseek-v4-flash' }),
    record({ provider: null, model: null, preset: null }),
  ]);
  assert.equal(groups.length, 3);
  const pro = groups.find((g) => g.model === 'deepseek-v4-pro');
  assert.equal(pro.records.length, 2);
  const unknown = groups.find((g) => g.model === null);
  assert.equal(unknown.records.length, 1);
  assert.equal(unknown.provider, null);
});

test('aggregateRecords computes per-dimension means over the group', () => {
  const groups = aggregateRecords([withWe(120), withWe(140), record({ model: 'other', vector: { ...BASE_VECTOR, we100: 999 } })]);
  const pro = groups.find((g) => g.model === 'deepseek-v4-pro');
  assert.equal(pro.count, 2);
  assert.equal(pro.vector.we100, 130);
  assert.equal(pro.vector.letMe100, 0);
  assert.ok(pro.blocks >= 200);
  for (const dim of VECTOR_DIMS) {
    assert.equal(typeof pro.vector[dim], 'number', dim);
  }
});

test('aggregateRecords tolerates missing vector dims and malformed values', () => {
  const groups = aggregateRecords([
    record({ vector: { we100: 10 } }),
    record({ vector: { we100: 'bad', letMe100: 3 } }),
  ]);
  const group = groups[0];
  assert.equal(group.count, 2);
  assert.equal(group.vector.we100, 10); // only the valid sample counts
  assert.equal(group.vector.letMe100, 3);
  assert.equal(group.vector.i100, 0); // absent dims default to 0
});

test('aggregateRecords handles an empty input', () => {
  assert.deepEqual(aggregateRecords([]), []);
});

test('resolveRecordPath expands leading tilde to the home directory', () => {
  assert.equal(resolveRecordPath('', '/home/u'), '');
  assert.equal(resolveRecordPath('~', '/home/u'), '/home/u');
  assert.equal(resolveRecordPath('~/x/y.jsonl', '/home/u'), '/home/u/x/y.jsonl');
  assert.equal(resolveRecordPath('/abs/path.jsonl', '/home/u'), '/abs/path.jsonl');
  assert.equal(resolveRecordPath('rel/path.jsonl', '/home/u'), 'rel/path.jsonl');
  assert.equal(resolveRecordPath('~user/x', '/home/u'), '~user/x'); // only leading ~/ expands
});

test('profileIdFromGroup derives a stable id', () => {
  assert.equal(profileIdFromGroup({ model: 'DeepSeek V4 Pro', preset: null }), 'deepseek-v4-pro-like');
  assert.equal(profileIdFromGroup({ model: null, preset: 'anchored-standard' }), 'anchored-standard-like');
  assert.equal(profileIdFromGroup({ model: null, preset: null }), 'custom-like');
});

test('profileFromGroup builds an applicable profile candidate', () => {
  const groups = aggregateRecords([withWe(120), withWe(140)]);
  const profile = profileFromGroup(groups[0]);
  assert.equal(profile.id, 'deepseek-v4-pro-like');
  assert.equal(profile.name, 'deepseek-v4-pro (measured)');
  assert.match(profile.description, /2 session record\(s\)/);
  assert.equal(profile.vector.we100, 130);
});

test('judgmentDistribution buckets session judgments', () => {
  const records = [
    { judgment: { family: 'minimal-like', mixed: false } },
    { judgment: { family: 'minimal-like', mixed: false } },
    { judgment: { mixed: true } },
    { judgment: { family: 'standard-like', mixed: false } },
    { judgment: {} },
  ];
  assert.deepEqual(judgmentDistribution(records), { spec: 2, react: 1, gray: 0, mixed: 1, sampling: 1 });
});

test('baselineDiff matches the nearest baseline and signs the diff', () => {
  const profiles = [
    { id: 'minimal-like', vector: { we100: 126, letMe100: 0.2, i100: 10, p50BlockChars: 182, visibleReplies100: 0.5, lets100: 60, firstLineWeNeed: 0.6, firstLineUserWants: 0.02, firstLineLetMe: 0.01, firstLineI: 0.02, firstLineOther: 0.35 } },
    { id: 'standard-like', vector: { we100: 14, letMe100: 208, i100: 195, p50BlockChars: 494, visibleReplies100: 44, lets100: 1, firstLineWeNeed: 0.05, firstLineUserWants: 0.45, firstLineLetMe: 0.3, firstLineI: 0.1, firstLineOther: 0.1 } },
  ];
  const specish = { we100: 150, letMe100: 0, i100: 12, p50BlockChars: 200, visibleReplies100: 1, lets100: 55, firstLineWeNeed: 0.7, firstLineUserWants: 0, firstLineLetMe: 0, firstLineI: 0, firstLineOther: 0.3 };
  const out = baselineDiff(specish, profiles);
  assert.equal(out.profileId, 'minimal-like');
  assert.ok(out.diffs.we100 > 0); // observed above baseline
  assert.ok(out.diffs.letMe100 < 0); // observed below baseline
  assert.equal(typeof out.distance, 'number');
});

test('baselineDiff handles an empty profile list', () => {
  assert.deepEqual(baselineDiff({ we100: 1 }, []), { profileId: null, distance: null, diffs: {} });
});

test('baselineDiff applies the strong directional override', () => {
  const profiles = [
    { id: 'minimal-like', vector: { we100: 126, letMe100: 0.2, i100: 10, lets100: 60, p50BlockChars: 182, visibleReplies100: 0.5, firstLineWeNeed: 0.6, firstLineUserWants: 0.02, firstLineLetMe: 0.01, firstLineI: 0.02, firstLineOther: 0.35 } },
    { id: 'standard-like', vector: { we100: 14, letMe100: 208, i100: 195, lets100: 1, p50BlockChars: 494, visibleReplies100: 44, firstLineWeNeed: 0.05, firstLineUserWants: 0.45, firstLineLetMe: 0.3, firstLineI: 0.1, firstLineOther: 0.1 } },
    { id: 'gray-like', vector: { we100: 7, letMe100: 14, i100: 340, lets100: 0, p50BlockChars: 310, visibleReplies100: 52, firstLineWeNeed: 0.02, firstLineUserWants: 0.05, firstLineLetMe: 0.05, firstLineI: 0.6, firstLineOther: 0.28 } },
  ];
  // runaway letMe with high I: nearest raw baseline is gray (high I), but the
  // strong override must pick the react side.
  const v = { letMe100: 1706, we100: 16, i100: 1295, lets100: 0, p50BlockChars: 300, visibleReplies100: 20, firstLineWeNeed: 0, firstLineUserWants: 0.1, firstLineLetMe: 0.5, firstLineI: 0.3, firstLineOther: 0.1 };
  const out = baselineDiff(v, profiles);
  assert.equal(out.profileId, 'standard-like');
  assert.ok(out.diffs.letMe100 > 0);
});
