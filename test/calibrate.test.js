import test from 'node:test';
import assert from 'node:assert/strict';
import { groupRecords, aggregateRecords, profileFromGroup, profileIdFromGroup, resolveRecordPath, VECTOR_DIMS } from '../lib/calibrate.js';

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
