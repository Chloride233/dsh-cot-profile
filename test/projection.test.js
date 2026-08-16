import test from 'node:test';
import assert from 'node:assert/strict';
import { initState, foldEvent, renderView } from '../lib/projection.js';

const DEFAULT_CONFIG = {
  minBlocksForJudgment: 10,
  weights: {},
  profiles: [],
  badge: true,
  panel: true,
  panelMode: 'overlay',
};

function blockStart(turn, step, index) {
  return { type: 'assistant/chunk', data: { turn, step, chunk: { type: 'block-start', blockType: 'reasoning', index } } };
}
function delta(turn, step, index, text) {
  return { type: 'assistant/chunk', data: { turn, step, chunk: { type: 'reasoning-delta', index, text } } };
}
function blockEnd(turn, step, index, text) {
  return { type: 'assistant/chunk', data: { turn, step, chunk: { type: 'block-end', index, block: { type: 'reasoning', text } } } };
}
function stepEnd(turn, step) {
  return { type: 'step/end', data: { turn, step } };
}
function turnEnd(turn) {
  return { type: 'turn/end', data: { turn } };
}
function assistantMessage() {
  return { type: 'assistant/message', data: {} };
}

test('unrelated events return the same state reference', () => {
  const state = initState();
  assert.equal(foldEvent(state, { type: 'user/message', data: {} }), state);
});

test('folds a reasoning block from deltas and block-end text', () => {
  let state = initState();
  state = foldEvent(state, blockStart(0, 0, 0));
  state = foldEvent(state, delta(0, 0, 0, 'We need to think.'));
  state = foldEvent(state, delta(0, 0, 0, ' Let me check.'));
  state = foldEvent(state, blockEnd(0, 0, 0, 'We need to think. Let me check.'));
  assert.equal(state.blocks, 1);
  assert.equal(state.counts.we, 1);
  assert.equal(state.counts.letMe, 1);
  assert.equal(state.firstLines['we-need'], 1);
  assert.equal(state.revision, 1);
  assert.equal(Object.keys(state.pending).length, 0);
});

test('block-end text is authoritative over accumulated deltas', () => {
  let state = initState();
  state = foldEvent(state, blockStart(0, 0, 0));
  state = foldEvent(state, delta(0, 0, 0, 'stale delta'));
  state = foldEvent(state, blockEnd(0, 0, 0, 'We need fresh.'));
  assert.equal(state.counts.we, 1);
});

test('step/end and turn/end clear pending buffers', () => {
  let state = initState();
  state = foldEvent(state, blockStart(1, 2, 3));
  state = foldEvent(state, delta(1, 2, 3, 'partial'));
  assert.equal(Object.keys(state.pending).length, 1);
  state = foldEvent(state, stepEnd(1, 2));
  assert.equal(Object.keys(state.pending).length, 0);
});

test('turn/end counts interim visible replies (messages minus final)', () => {
  let state = initState();
  state = foldEvent(state, assistantMessage());
  state = foldEvent(state, assistantMessage());
  state = foldEvent(state, assistantMessage());
  state = foldEvent(state, turnEnd(0));
  assert.equal(state.visibleReplies, 2);
  assert.equal(state.messagesThisTurn, 0);
});

test('renderView normalizes judgment while sampling and judges after minBlocks', () => {
  const config = { ...DEFAULT_CONFIG, minBlocksForJudgment: 2 };
  let state = initState();
  state = foldEvent(state, blockStart(0, 0, 0));
  state = foldEvent(state, blockEnd(0, 0, 0, 'We need a plan.'));
  let view = renderView(state, config);
  assert.equal(view.judgment.sufficient, false);
  assert.equal(view.judgment.family, '');
  assert.deepEqual(view.judgment.distances, {});

  state = foldEvent(state, blockStart(0, 0, 1));
  state = foldEvent(state, blockEnd(0, 0, 1, 'We need to move fast.'));
  view = renderView(state, config);
  assert.equal(view.judgment.sufficient, true);
  assert.equal(view.judgment.family, 'minimal-like');
  assert.equal(view.blocks, 2);
  assert.equal(view.minBlocks, 2);
  assert.ok(view.revision >= 2);
  assert.equal(view.ui.badge, true);
  assert.equal(view.ui.panel, true);
  assert.equal(view.ui.panelMode, 'overlay');
});

test('full pipeline: minimal-like session is judged minimal-like; standard-like is not', () => {
  const config = { ...DEFAULT_CONFIG, minBlocksForJudgment: 5 };
  let state = initState();
  const minimalTexts = [
    'We need to inspect the failing test.',
    'We need a clean reproduction.',
    'We need to check the logs first.',
    "We'll fix the ordering issue.",
    'We need to verify the build.',
  ];
  minimalTexts.forEach((text, i) => {
    state = foldEvent(state, blockStart(0, 0, i));
    state = foldEvent(state, blockEnd(0, 0, i, text));
  });
  state = foldEvent(state, turnEnd(0));
  const minimalView = renderView(state, config);
  assert.equal(minimalView.judgment.family, 'minimal-like');
  assert.equal(minimalView.counts.letMe, 0);
  assert.ok(minimalView.counts.we >= 4);

  let standard = initState();
  const standardTexts = [
    'The user wants the build green quickly. Let me check the failing tests first. I think there is a timeout issue in the harness module that we ship.',
    'Let me look at the stack trace and the last test output. The user wants a minimal repro. I will isolate the module that flakes and rerun it.',
    'Let me try running the tests again with more logging. I believe the ordering matters here. The user wants a fast fix for the CI pipeline.',
    'The user wants a clean patch. Let me inspect the diff carefully. I am going to adjust the sleep interval and verify the timing.',
    'Let me verify the behavior locally first. I will write a small script to reproduce the failure. The user wants the CI green by noon.',
  ];
  standardTexts.forEach((text, i) => {
    standard = foldEvent(standard, blockStart(1, 0, i));
    standard = foldEvent(standard, blockEnd(1, 0, i, text));
  });
  standard = foldEvent(standard, assistantMessage());
  standard = foldEvent(standard, assistantMessage());
  standard = foldEvent(standard, assistantMessage());
  standard = foldEvent(standard, turnEnd(1));
  const standardView = renderView(standard, config);
  assert.equal(standardView.judgment.family, 'standard-like');
  assert.ok(standardView.counts.letMe >= 5);
  assert.equal(standardView.visibleReplies, 2);
});
