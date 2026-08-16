/**
 * dsh-cot-profile — pure session-projection fold and view rendering.
 *
 * Zero-dependency: the projection unit's `init`/`apply`/`view` live here so
 * the full event→stats→judgment→payload pipeline is unit-testable without the
 * host runtime. The host wraps these into a registry `ProjectionDefinition`
 * (adding only the zod wire schema and the config thunk).
 *
 * Determinism rule: `apply` never reads the clock or any external state —
 * checkpoint + forward replay reproduce the state exactly. All state is plain
 * JSON.
 */
import {
  countPhrases,
  classifyFirstLine,
  tokenize,
  buildVector,
  median,
  judge,
  DEFAULT_WEIGHTS,
} from './analyzer.js';
import { resolveProfiles } from './profiles.js';

function keyFor(turn, step, index) {
  return `${turn}\u0000${step}\u0000${index}`;
}

/** Initial projection state for an empty log. */
export function initState() {
  return {
    blocks: 0,
    lengths: [],
    counts: { letMe: 0, we: 0, lets: 0, i: 0 },
    firstLines: { 'we-need': 0, 'the-user-wants': 0, 'let-me': 0, i: 0, other: 0 },
    visibleReplies: 0,
    messagesThisTurn: 0,
    pending: {},
    revision: 0,
  };
}

function clearPending(state, prefix) {
  const keys = Object.keys(state.pending).filter((k) => k.startsWith(prefix));
  if (keys.length === 0) return state;
  const pending = { ...state.pending };
  for (const k of keys) delete pending[k];
  return { ...state, pending };
}

function applyBlock(state, text, pending) {
  if (typeof text !== 'string' || text.length === 0) return { ...state, pending };
  const counts = countPhrases(tokenize(text));
  const firstLine = classifyFirstLine(text);
  return {
    ...state,
    pending,
    blocks: state.blocks + 1,
    lengths: [...state.lengths, text.length],
    counts: {
      letMe: state.counts.letMe + counts.letMe,
      we: state.counts.we + counts.we,
      lets: state.counts.lets + counts.lets,
      i: state.counts.i + counts.i,
    },
    firstLines: {
      ...state.firstLines,
      [firstLine]: state.firstLines[firstLine] + 1,
    },
    revision: state.revision + 1,
  };
}

/**
 * Fold one committed session event into the projection state.
 * Returns the SAME state reference for unrelated events (zero downstream work
 * in the registry).
 */
export function foldEvent(state, event) {
  if (event.type === 'assistant/chunk') {
    const { turn, step, chunk } = event.data ?? {};
    if (!chunk) return state;
    const key = keyFor(turn, step, chunk.index);
    if (chunk.type === 'block-start' && chunk.blockType === 'reasoning') {
      return { ...state, pending: { ...state.pending, [key]: '' } };
    }
    if (chunk.type === 'reasoning-delta') {
      const prev = state.pending[key] ?? '';
      return { ...state, pending: { ...state.pending, [key]: prev + chunk.text } };
    }
    if (chunk.type === 'block-end' && chunk.block?.type === 'reasoning') {
      const text = chunk.block.text ?? state.pending[key] ?? '';
      const pending = { ...state.pending };
      delete pending[key];
      return applyBlock(state, text, pending);
    }
    return state;
  }
  if (event.type === 'assistant/message') {
    return { ...state, messagesThisTurn: state.messagesThisTurn + 1 };
  }
  if (event.type === 'step/end') {
    const { turn, step } = event.data ?? {};
    return clearPending(state, `${turn}\u0000${step}\u0000`);
  }
  if (event.type === 'turn/end') {
    const { turn } = event.data ?? {};
    const cleared = clearPending(state, `${turn}\u0000`);
    // All but the last assistant/message of a turn are interim visible replies.
    const interim = Math.max(0, state.messagesThisTurn - 1);
    if (interim === 0) return { ...cleared, messagesThisTurn: 0 };
    return {
      ...cleared,
      visibleReplies: cleared.visibleReplies + interim,
      messagesThisTurn: 0,
    };
  }
  return state;
}

/**
 * Render the wire payload (whole value) from projection state + config.
 * Judgment is normalized so the wire schema's fields are always present.
 *
 * @param config { minBlocksForJudgment, weights, profiles, badge, panel, panelMode }
 */
export function renderView(state, config) {
  const vector = buildVector(state);
  const profiles = resolveProfiles(config.profiles);
  const weights = { ...DEFAULT_WEIGHTS, ...config.weights };
  const judged = judge(vector, state.blocks, profiles, weights, config.minBlocksForJudgment);
  const judgment = judged.sufficient
    ? judged
    : { sufficient: false, family: '', confidence: 0, distances: {}, mixed: false, mixedReason: '' };
  return {
    v: 1,
    blocks: state.blocks,
    minBlocks: config.minBlocksForJudgment,
    counts: { ...state.counts },
    firstLines: { ...state.firstLines },
    p50BlockChars: median(state.lengths),
    visibleReplies: state.visibleReplies,
    vector,
    judgment,
    ui: {
      badge: config.badge,
      panel: config.panel,
      panelMode: config.panelMode ?? 'overlay',
      profilesCount: Array.isArray(config.profiles) ? config.profiles.length : 0,
    },
    revision: state.revision,
  };
}
