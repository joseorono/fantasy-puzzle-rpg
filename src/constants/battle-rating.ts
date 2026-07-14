/**
 * Tunable constants for the arcade victory rating (see `~/lib/battle-rating.ts` for the logic and
 * `~/components/battle/battle-rating-screen.tsx` for the presentation). Every magic number lives
 * here so balance can be tweaked in one place.
 *
 * Design intent: the rating rewards *skill* (fast clears, keeping HP, not leaning on items) and
 * only lightly rewards RNG-dependent outcomes (raw match score and cascade combos depend on how
 * the board falls), so those carry small weights.
 */

/** Rating criterion keys, in display order. */
export type RatingCriterionKey = 'time' | 'hp' | 'combo' | 'score' | 'items';

/**
 * Weights of the positive criteria (must sum to 1). Skill criteria (time, HP) dominate; the
 * RNG-heavy ones (score, combo) are deliberately minor. Items are a separate penalty, not here.
 */
export const RATING_WEIGHTS: Record<'time' | 'hp' | 'score' | 'combo', number> = {
  time: 0.4,
  hp: 0.4,
  score: 0.1,
  combo: 0.1,
};

/** Criteria whose outcome is heavily board-RNG dependent (flagged for the UI to de-emphasize). */
export const RNG_HEAVY_CRITERIA: readonly RatingCriterionKey[] = ['score', 'combo'];

// ─── Per-criterion normalization targets ─────────────────────────────────────

/** Clear at or under this (ms) → full time marks. */
export const TIME_FULL_MS = 25_000;
/** Clear at or over this (ms) → zero time marks. Between the two, marks scale linearly. */
export const TIME_ZERO_MS = 150_000;

/** Match score at which the (minor) score criterion maxes out. */
export const SCORE_TARGET = 2_500;

/** Max cascade combo at which the (minor) combo criterion maxes out. */
export const COMBO_TARGET = 5;

// ─── Items-used penalty ──────────────────────────────────────────────────────

/** Normalized rating lost per battle item used. */
export const ITEM_PENALTY_PER_USE = 0.12;
/** Cap on the total items penalty, so items can't drive the rating below the floor alone. */
export const MAX_ITEM_PENALTY = 0.5;

// ─── Stars ───────────────────────────────────────────────────────────────────

/**
 * Ascending normalized-total cutoffs (inclusive). You always start at 1 star for winning, then
 * earn one more for each cutoff cleared: `stars = 1 + (# of thresholds ≤ normalized)`. Four
 * cutoffs → up to 5 stars.
 */
export const STAR_THRESHOLDS = [0.3, 0.52, 0.72, 0.9] as const;

/** Total stars possible (1 for winning + one per threshold). */
export const MAX_STARS = STAR_THRESHOLDS.length + 1;

/** Points scale — a perfect (pre-penalty) run is worth ~this many "arcade points". */
export const RATING_POINTS_SCALE = 1000;

/** Short rank caption shown on the ribbon. Low tiers lean into the "you scraped by" framing. */
export const STAR_RANK_LABELS: Record<number, string> = {
  1: 'SURVIVED',
  2: 'CLEAR',
  3: 'GOOD',
  4: 'GREAT',
  5: 'PERFECT',
};

/** Flavor line under the ribbon; low tiers emphasize how close the call was. */
export const STAR_RANK_TAGLINES: Record<number, string> = {
  1: 'That was close — you barely made it!',
  2: 'A narrow escape. You scraped through.',
  3: 'A solid victory.',
  4: 'Masterfully fought!',
  5: 'A flawless triumph!',
};

/** At or below this star count, the flavor line reads as a warning (close call). */
export const CLOSE_CALL_MAX_STARS = 2;

/**
 * Loot multiplier granted by the star rating — scales the money + resources earned from a battle
 * (never items or XP). 1★ is baseline; a rare 5★ doubles your haul. Read only via
 * `getLootMultiplier` in `~/lib/battle-rating.ts`.
 */
export const LOOT_MULTIPLIER_BY_STARS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.25,
  4: 1.5,
  5: 2.0,
};

/**
 * Send-off line shown on the VICTORY modal (after the rating screen), chosen by star rating —
 * from a scraped-by escape at 1 star to a total rout at 5.
 */
export const VICTORY_FLAVOR_BY_STARS: Record<number, string> = {
  1: 'You barely escaped with your life.',
  2: 'A hard-fought win.',
  3: 'You live to fight another day!',
  4: 'You did very well!',
  5: 'They never stood a chance.',
};

// ─── Colors (warm palette; indigolay-red framing lives in the component/CSS) ──

/** Filled star (warm gold, matches the project's flinch/callout amber). */
export const STAR_COLOR_FILLED = '#f6c453';
/** Empty star slot (muted brown). */
export const STAR_COLOR_EMPTY = '#5c4a32';
/** Accent for a positive criterion's points. */
export const CRITERION_COLOR_POSITIVE = '#e8c87e';
/** Accent for the items-used penalty row. */
export const CRITERION_COLOR_PENALTY = '#d98a6a';

// ─── Reveal-animation timing (ms) ────────────────────────────────────────────

/** Cadence for the staggered results reveal. */
export const RATING_REVEAL = {
  /** Delay after the card pops in before the first criterion row reveals. */
  startDelayMs: 350,
  /** Gap between each criterion row reveal (also the click-change-tab cadence). */
  rowStaggerMs: 450,
  /** Gap between each star filling in (also the click-coin cadence). */
  starStaggerMs: 380,
  /** Delay after the last star before the "LOOT BONUS ×N" line pops. */
  lootRevealDelayMs: 400,
  /** Delay after the loot line before the Continue button enables. */
  continueDelayMs: 450,
} as const;

