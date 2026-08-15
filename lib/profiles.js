/**
 * Built-in trajectory profile baselines for dsh-cot-profile.
 *
 * Derived from the public aggregate analysis in xiaobright/modeltest
 * (docs/v4.1/DEEPSEEK_V4_TRAJECTORY_ANALYSIS_20260814.md, 11 DSH/OpenCode
 * exports), normalized to per-100-blocks.
 *
 * IMPORTANT: these are ESTIMATES computed by hand from the published table.
 * They are explicitly not ground truth — calibrate them with record-mode data
 * (see README "Record mode"): run real sessions, collect `cot-profile/record`
 * events, and update these vectors.
 *
 * Honest framing: a trajectory family describes (model × assembly) behavior,
 * NOT model identity. The research shows the same wording pattern across
 * different models when the interface changes (the V4 Flash counterexample).
 */

export const BUILTIN_PROFILES = [
  {
    id: 'minimal-like',
    name: 'Minimal-like',
    description:
      'Anchored trajectory: we/let\'s-heavy, let me≈0, short blocks, ~1 visible reply. Matches minimal / anchored-standard runs.',
    vector: {
      letMe100: 0.2,
      we100: 126,
      lets100: 60,
      i100: 10,
      firstLineWeNeed: 0.6,
      firstLineUserWants: 0.02,
      firstLineLetMe: 0.01,
      firstLineI: 0.02,
      firstLineOther: 0.35,
      p50BlockChars: 182,
      visibleReplies100: 0.5,
    },
  },
  {
    id: 'standard-like',
    name: 'Standard-like',
    description:
      'Standard / PTC trajectory: let me-heavy, we/let\'s low, long blocks, many visible replies.',
    vector: {
      letMe100: 208,
      we100: 14,
      lets100: 1,
      i100: 195,
      firstLineWeNeed: 0.05,
      firstLineUserWants: 0.45,
      firstLineLetMe: 0.3,
      firstLineI: 0.1,
      firstLineOther: 0.1,
      p50BlockChars: 494,
      visibleReplies100: 44,
    },
  },
  {
    id: 'gray-like',
    name: 'Gray-like',
    description:
      'OpenCode gray-route trajectory: I/I\'m-heavy, let me low.',
    vector: {
      letMe100: 14,
      we100: 7,
      lets100: 0,
      i100: 340,
      firstLineWeNeed: 0.02,
      firstLineUserWants: 0.05,
      firstLineLetMe: 0.05,
      firstLineI: 0.6,
      firstLineOther: 0.28,
      p50BlockChars: 310,
      visibleReplies100: 52,
    },
  },
];

/** Resolve configured profiles against the built-ins (empty → built-ins). */
export function resolveProfiles(configured) {
  return Array.isArray(configured) && configured.length > 0 ? configured : BUILTIN_PROFILES;
}
