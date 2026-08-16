import type { SessionProjectionMap } from '@deepseek-ai/dsh-session-projection/types';

/** Signature-phrase counts for one session. */
export interface CotProfileCounts {
  letMe: number;
  we: number;
  lets: number;
  i: number;
}

/** First-line class tallies for one session. */
export interface CotProfileFirstLines {
  'we-need': number;
  'the-user-wants': number;
  'let-me': number;
  i: number;
  other: number;
}

/** Result of the weighted-distance profile judgment. */
export interface CotProfileJudgment {
  /** False while blocks < minBlocks ("sampling"). */
  sufficient: boolean;
  /** Closest profile family id ('' while sampling or in the transition band). */
  family: string;
  /** 1 − d₁/(d₁+d₂); 0 while sampling. */
  confidence: number;
  /** Weighted distance per family. */
  distances: Record<string, number>;
  /**
   * Transition band (router-standard "mixed"): the trajectory cannot be
   * reliably assigned — low confidence or We/The/Let mixing. Do not trust
   * `family` when this is true.
   */
  mixed: boolean;
  /** 'low-confidence' | 'dual-indicator' | '' — why `mixed` is true. */
  mixedReason: string;
}

/** Live projection payload for the `cot-profile` key (wire JSON). */
export interface CotProfileView {
  v: number;
  /** Completed reasoning blocks counted. */
  blocks: number;
  /** Judgment threshold from config. */
  minBlocks: number;
  counts: CotProfileCounts;
  firstLines: CotProfileFirstLines;
  p50BlockChars: number;
  visibleReplies: number;
  /** Normalized indicator vector (per-100-blocks rates + proportions). */
  vector: Record<string, number>;
  judgment: CotProfileJudgment;
  /** UI toggles resolved from config (host-side). */
  ui: { badge: boolean; panel: boolean; panelMode: 'overlay' | 'track'; profilesCount: number };
  /** Monotonic per-session change counter. */
  revision: number;
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    'cot-profile': CotProfileView;
  }
}

export declare const name = 'cot-profile';
export declare const inject: string[];
export declare const SETTINGS_NAMESPACE: string;
export declare const PROJECTION_KEY = 'cot-profile';
export declare const Config: import('@deepseek-ai/schemastery').default;
export declare function apply(ctx: import('@deepseek-ai/cordis').Context, config?: unknown): void;
