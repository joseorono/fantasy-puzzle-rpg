/**
 * Arcade victory rating — pure scoring logic. Given a battle's end-of-fight stats, produces a
 * per-criterion breakdown and a 1–3 star result. UI-agnostic and fully unit-tested; all tunables
 * live in `~/constants/battle-rating.ts`.
 *
 * Skill criteria (clear time, HP kept) dominate; RNG-heavy ones (match score, cascade combo) carry
 * small weights; using battle items applies a capped penalty.
 */
import {
  RATING_WEIGHTS,
  RNG_HEAVY_CRITERIA,
  TIME_FULL_MS,
  TIME_ZERO_MS,
  SCORE_TARGET,
  COMBO_TARGET,
  ITEM_PENALTY_PER_USE,
  MAX_ITEM_PENALTY,
  STAR_THRESHOLDS,
  RATING_POINTS_SCALE,
  LOOT_MULTIPLIER_BY_STARS,
  type RatingCriterionKey,
} from '~/constants/battle-rating';

/** Raw end-of-battle stats fed into the rating. */
export interface BattleRatingInput {
  /** Battle duration in milliseconds. */
  elapsedMs: number;
  /** Accumulated match score. */
  score: number;
  /** Deepest cascade combo reached (chain length). */
  maxCombo: number;
  /** Party HP remaining as a fraction (0..1) of max HP at victory. */
  hpRemainingPct: number;
  /** Number of battle items consumed (penalty). */
  itemsUsed: number;
}

/** A single scored line on the results screen. */
export interface RatingCriterion {
  key: RatingCriterionKey;
  label: string;
  /** Preformatted achievement value, e.g. "0:42", "1,240", "x4", "88%", "2". */
  displayValue: string;
  /** Signed points contribution (negative for the items penalty). */
  points: number;
  /** True for the items-used penalty row. */
  isPenalty: boolean;
  /** True for board-RNG-dependent criteria (score, combo) so the UI can de-emphasize them. */
  isRngHeavy: boolean;
  /** True when HP remaining is full (a flawless clear). */
  isFlawless: boolean;
}

/** Full rating outcome. */
export interface BattleRatingResult {
  /** 1–5 stars (you always earn at least one for winning). */
  stars: number;
  /** Total arcade points (>= 0), after the items penalty. */
  totalScore: number;
  /** Normalized total (0..1) used to derive the stars. */
  normalized: number;
  /** Multiplier applied to earned money + resources (never items/XP). >= 1. */
  lootMultiplier: number;
  /** Per-criterion breakdown, in display order. */
  criteria: RatingCriterion[];
}

/**
 * The loot multiplier earned for a given star rating — scales money + resources only. Reads the
 * tunable {@link LOOT_MULTIPLIER_BY_STARS} map; falls back to 1 (no bonus) for unmapped counts.
 * @param stars Star rating (1..MAX_STARS).
 * @returns A multiplier >= 1.
 */
export function getLootMultiplier(stars: number): number {
  return LOOT_MULTIPLIER_BY_STARS[stars] ?? 1;
}

/** Clamps a value to the [0, 1] range. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Formats a duration as `M:SS` (e.g. 42000 → "0:42", 125000 → "2:05").
 * @param ms Duration in milliseconds (negative is treated as 0).
 */
export function formatClearTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Inserts thousands separators (locale-independent), e.g. 12480 → "12,480". */
export function formatThousands(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Faster clears score higher; linear between {@link TIME_FULL_MS} and {@link TIME_ZERO_MS}. */
function normalizeTime(elapsedMs: number): number {
  return clamp01((TIME_ZERO_MS - elapsedMs) / (TIME_ZERO_MS - TIME_FULL_MS));
}

function toPoints(weightedNormalized: number): number {
  return Math.round(weightedNormalized * RATING_POINTS_SCALE);
}

/**
 * Computes the arcade rating for a won battle.
 * @param input Raw end-of-battle stats.
 * @returns A star count, total points, and the per-criterion breakdown for display.
 */
export function computeBattleRating(input: BattleRatingInput): BattleRatingResult {
  const { elapsedMs, score, maxCombo, hpRemainingPct, itemsUsed } = input;

  const subTime = normalizeTime(elapsedMs);
  const subHp = clamp01(hpRemainingPct);
  const subScore = clamp01(SCORE_TARGET > 0 ? score / SCORE_TARGET : 0);
  const subCombo = clamp01(COMBO_TARGET > 0 ? maxCombo / COMBO_TARGET : 0);

  const positive =
    RATING_WEIGHTS.time * subTime +
    RATING_WEIGHTS.hp * subHp +
    RATING_WEIGHTS.score * subScore +
    RATING_WEIGHTS.combo * subCombo;

  const itemPenalty = Math.min(Math.max(0, itemsUsed) * ITEM_PENALTY_PER_USE, MAX_ITEM_PENALTY);
  const normalized = clamp01(positive - itemPenalty);

  // 1 star for winning, +1 per cleared threshold.
  const stars = STAR_THRESHOLDS.reduce((count, threshold) => count + (normalized >= threshold ? 1 : 0), 1);

  const isRng = (key: RatingCriterionKey) => RNG_HEAVY_CRITERIA.includes(key);
  const isFlawless = subHp >= 1;

  const criteria: RatingCriterion[] = [
    {
      key: 'time',
      label: 'CLEAR TIME',
      displayValue: formatClearTime(elapsedMs),
      points: toPoints(RATING_WEIGHTS.time * subTime),
      isPenalty: false,
      isRngHeavy: isRng('time'),
      isFlawless: false,
    },
    {
      key: 'hp',
      label: 'HP REMAINING',
      displayValue: `${Math.round(subHp * 100)}%`,
      points: toPoints(RATING_WEIGHTS.hp * subHp),
      isPenalty: false,
      isRngHeavy: isRng('hp'),
      isFlawless,
    },
    {
      key: 'combo',
      label: 'MAX COMBO',
      displayValue: `x${Math.max(0, Math.floor(maxCombo))}`,
      points: toPoints(RATING_WEIGHTS.combo * subCombo),
      isPenalty: false,
      isRngHeavy: isRng('combo'),
      isFlawless: false,
    },
    {
      key: 'score',
      label: 'MATCH SCORE',
      displayValue: formatThousands(score),
      points: toPoints(RATING_WEIGHTS.score * subScore),
      isPenalty: false,
      isRngHeavy: isRng('score'),
      isFlawless: false,
    },
    {
      key: 'items',
      label: 'ITEMS USED',
      displayValue: `${Math.max(0, Math.floor(itemsUsed))}`,
      points: -toPoints(itemPenalty),
      isPenalty: true,
      isRngHeavy: false,
      isFlawless: false,
    },
  ];

  const totalScore = Math.max(0, criteria.reduce((sum, c) => sum + c.points, 0));

  return { stars, totalScore, normalized, lootMultiplier: getLootMultiplier(stars), criteria };
}
