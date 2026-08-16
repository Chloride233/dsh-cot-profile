/**
 * dsh-cot-profile — pure reasoning-trajectory analysis.
 *
 * Zero-dependency functions: tokenization, signature-phrase counting,
 * first-line classification, indicator vectors, and weighted-distance
 * judgment. Kept free of host/client imports so it is trivially
 * unit-testable and reusable by any consumer.
 *
 * Indicator baselines and counts follow the public aggregate analysis in
 * xiaobright/modeltest (docs/v4.1/DEEPSEEK_V4_TRAJECTORY_ANALYSIS_20260814.md,
 * 11 DSH/OpenCode exports). They are ESTIMATES awaiting calibration against
 * real session records.
 */

const TOKEN_RE = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g;

/** First-person pronoun forms counted for the `I` indicator (research口径). */
const I_FORMS = new Set(['i', "i'm", "i'll", "i've", "i'd"]);

/** First-line trajectory classes (research families). */
export const FIRST_LINE_CLASSES = [
  'we-need',
  'the-user-wants',
  'let-me',
  'i',
  'other',
];

/** Normalize typographic apostrophes so "let's"/"let’s" match alike. */
export function normalize(text) {
  return String(text).replace(/’/g, "'");
}

/** Split text into lowercase word tokens (apostrophes kept). */
export function tokenize(text) {
  const out = [];
  const re = new RegExp(TOKEN_RE.source, 'g');
  const source = normalize(text);
  let m;
  while ((m = re.exec(source)) !== null) out.push(m[0].toLowerCase());
  return out;
}

/**
 * Count the four signature phrases over a token list:
 * `let me` (bigram), `we`, `let's`, and first-person `I` forms.
 * Boundary matching by construction — a token must equal the phrase.
 */
export function countPhrases(tokens) {
  const counts = { letMe: 0, we: 0, lets: 0, i: 0 };
  for (let idx = 0; idx < tokens.length; idx += 1) {
    const tok = tokens[idx];
    if (tok === 'we') {
      counts.we += 1;
    } else if (tok === "let's") {
      counts.lets += 1;
    } else if (I_FORMS.has(tok)) {
      counts.i += 1;
    } else if (tok === 'let' && tokens[idx + 1] === 'me') {
      counts.letMe += 1;
      idx += 1;
    }
  }
  return counts;
}

/**
 * Classify a reasoning block's first line into one trajectory class.
 * The research anchors on first lines like "We need modify…" (minimal) vs
 * "The user wants…"/"Let me…" (standard-like) vs "I…" (gray route).
 */
export function classifyFirstLine(text) {
  const line = normalize(text).trim().toLowerCase().replace(/^[\s>*#_\-—•]+/, '');
  if (line.startsWith('we need')) return 'we-need';
  if (line.startsWith('the user want')) return 'the-user-wants';
  if (line.startsWith('let me')) return 'let-me';
  const first = (line.match(/[a-z0-9']+/) || [''])[0];
  if (I_FORMS.has(first)) return 'i';
  return 'other';
}

/** Median of block character lengths (0 for an empty list). */
export function median(lengths) {
  if (lengths.length === 0) return 0;
  const sorted = [...lengths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Build the normalized indicator vector from raw per-block stats.
 * Counts scale to per-100-blocks (research口径); first-line counts become
 * proportions; p50 and visible replies stay absolute.
 *
 * @param stats { blocks, lengths, counts, firstLines, visibleReplies }
 */
export function buildVector(stats) {
  const blocks = Math.max(1, stats.blocks);
  const rate = (n) => Math.round((n / blocks) * 1000) / 10;
  const fl = stats.firstLines;
  const flTotal = FIRST_LINE_CLASSES.reduce((sum, k) => sum + (fl[k] || 0), 0) || 1;
  const prop = (k) => Math.round(((fl[k] || 0) / flTotal) * 1000) / 1000;
  return {
    letMe100: rate(stats.counts.letMe),
    we100: rate(stats.counts.we),
    lets100: rate(stats.counts.lets),
    i100: rate(stats.counts.i),
    firstLineWeNeed: prop('we-need'),
    firstLineUserWants: prop('the-user-wants'),
    firstLineLetMe: prop('let-me'),
    firstLineI: prop('i'),
    firstLineOther: prop('other'),
    p50BlockChars: median(stats.lengths),
    visibleReplies100: rate(stats.visibleReplies),
  };
}

/** Default per-dimension weights; `let me`/`we` dominate (research separation). */
export const DEFAULT_WEIGHTS = {
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

/** Soft relative error in [0,1): 0 when equal, approaches 1 as divergence grows. */
export function dimensionScore(observed, baseline) {
  return Math.abs(observed - baseline) / (Math.abs(observed) + Math.abs(baseline) + 1);
}

/**
 * Weighted Manhattan distance over named vector dims, normalized to [0,1).
 * Iterates the baseline's dims so user-defined profiles may use their own.
 */
export function distance(observed, baseline, weights) {
  let total = 0;
  let weightSum = 0;
  for (const dim of Object.keys(baseline)) {
    const w = weights[dim] ?? 1;
    total += w * dimensionScore(observed[dim] ?? 0, baseline[dim] ?? 0);
    weightSum += w;
  }
  return weightSum === 0 ? 0 : total / weightSum;
}

/** Transition-band (router-standard "mixed" band) detection defaults. */
export const MIXED_DEFAULTS = {
  /** Confidence below this marks the trajectory as uncertain (transition band). */
  confidenceThreshold: 0.6,
  /**
   * Per-100-blocks thresholds for the dual-indicator test. Asymmetric on
   * purpose: react-side sessions carry we100 in the ~11–17 range (Standard
   * we=11/99, PTC 16/94 in modeltest), while spec-side letMe100 is ≈0 — so
   * `we` needs a higher bar than `let me` to avoid flagging normal react
   * trajectories.
   */
  letMeThreshold: 15,
  weThreshold: 30,
  /**
   * Strong-signal override: per-100-blocks count at which a side's indicator
   * is "runaway" (far above its baseline, e.g. letMe100 ≈ 1500 from a
   * tool-heavy session). Combined with a dominance fraction to bypass the
   * low-confidence mixed trap for genuinely extreme trajectories.
   */
  strongSignalMin: 300,
  /** Fraction of (letMe+we) one side must hold to count as dominant. */
  strongFraction: 0.9,
};

/**
 * Judge the closest profile family with confidence.
 * Returns `{ sufficient: false }` until `minBlocks` is reached, so the UI can
 * show "sampling" instead of a premature verdict.
 * Confidence = 1 − d₁/(d₁+d₂) over the two closest families.
 *
 * Transition-band detection (router-standard's measured "mixed" band): a
 * trajectory that cannot be reliably assigned — low confidence between the
 * closest families, or both `letMe100` and `we100` elevated (We/The/Let
 * mixing) — returns `mixed: true` with an empty `family` instead of a
 * possibly-wrong hard label. Do not trust `family` when `mixed` is true.
 *
 * @param options { confidenceThreshold, letMeThreshold, weThreshold }
 */
export function judge(observed, blocks, profiles, weights, minBlocks, options = {}) {
  if (blocks < minBlocks) return { sufficient: false };
  const opts = { ...MIXED_DEFAULTS, ...options };
  const scored = profiles.map((profile) => ({
    family: profile.id,
    distance: distance(observed, profile.vector, weights),
  }));
  scored.sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  const second = scored[1];
  const confidence = second
    ? 1 - best.distance / (best.distance + second.distance + 1e-9)
    : 1;
  const round3 = (n) => Math.round(n * 1000) / 1000;
  const distances = Object.fromEntries(scored.map((s) => [s.family, round3(s.distance)]));

  const lowConfidence = confidence < opts.confidenceThreshold;
  const dualIndicator =
    (observed.letMe100 ?? 0) >= opts.letMeThreshold &&
    (observed.we100 ?? 0) >= opts.weThreshold;
  // No signature signal at all (we+let me+let's+I all zero): nothing to
  // classify — router's probes flag such runs 'ambiguous' too.
  const noSignal =
    (observed.letMe100 ?? 0) + (observed.we100 ?? 0) + (observed.lets100 ?? 0) + (observed.i100 ?? 0) === 0;

  // Strong directional signal: when one side's indicator dominates
  // overwhelmingly AND is far above any baseline, the verdict is confident
  // even though the absolute distance is large (a runaway let-me count is
  // strongly react, not "uncertain"). Fixes: obs far from ALL baselines made
  // every distance ≈ 1, collapsing confidence to ~0.5 → spurious mixed.
  const letMe100 = observed.letMe100 ?? 0;
  const we100 = observed.we100 ?? 0;
  const dirTotal = letMe100 + we100;
  const reactFraction = dirTotal > 0 ? letMe100 / dirTotal : 0;
  const specFraction = dirTotal > 0 ? we100 / dirTotal : 0;
  const strongReact = reactFraction >= opts.strongFraction && letMe100 >= opts.strongSignalMin;
  const strongSpec = specFraction >= opts.strongFraction && we100 >= opts.strongSignalMin;

  if (strongReact || strongSpec) {
    // Force the directional side's family, not the nearest baseline: with a
    // runaway indicator the nearest profile can be pulled sideways by other
    // dims (e.g. gray's high-I baseline). Fall back to best when the
    // directional profile was removed/renamed by the user.
    const targetId = strongReact ? 'standard-like' : 'minimal-like';
    const target = profiles.find((p) => p.id === targetId);
    return {
      sufficient: true,
      family: target ? target.id : best.family,
      confidence: Math.max(round3(confidence), 0.85),
      distances,
      mixed: false,
      mixedReason: '',
    };
  }

  const mixed = lowConfidence || dualIndicator || noSignal;

  return {
    sufficient: true,
    family: mixed ? '' : best.family,
    confidence: round3(confidence),
    distances,
    mixed,
    mixedReason: mixed
      ? dualIndicator
        ? 'dual-indicator'
        : noSignal
          ? 'no-signal'
          : 'low-confidence'
      : '',
  };
}
