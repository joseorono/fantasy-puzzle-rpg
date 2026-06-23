/**
 * Pure helpers for the equipment rarity system.
 *
 * `rollRarity` is the only randomness here and is meant to be called *once* per
 * acquisition (a craft or a drop); the result is then stored on the inventory
 * instance, so nothing re-rolls or re-derives rarity during render or combat.
 */

import type { RarityTier } from '~/constants/rarity';
import {
  RARITY_TIERS,
  BASE_RARITY_WEIGHTS,
  RARITY_BIAS_FACTOR,
  RARITY_STAT_MULTIPLIER,
  RARITY_COLORS,
  RARITY_LABELS,
  DEFAULT_RARITY,
} from '~/constants/rarity';
import { randFloatInRange } from '~/lib/math';

/**
 * Roll a random rarity tier using the base weights, optionally biased toward
 * higher tiers.
 * @param bias Enemy/source bias (default 0). 0 reproduces `BASE_RARITY_WEIGHTS`;
 *   higher values lift the odds of rarer tiers (see `RARITY_BIAS_FACTOR`).
 * @returns A weighted-random rarity tier.
 */
export function rollRarity(bias: number = 0): RarityTier {
  const weights = RARITY_TIERS.map((tier, index) => BASE_RARITY_WEIGHTS[tier] * (1 + bias * index * RARITY_BIAS_FACTOR));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  let roll = randFloatInRange(0, total);
  for (let i = 0; i < RARITY_TIERS.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return RARITY_TIERS[i];
  }
  // Fallback for floating-point edge cases — return the highest tier.
  return RARITY_TIERS[RARITY_TIERS.length - 1];
}

/**
 * Scale a single stat value by a rarity multiplier. Only positive values are
 * scaled (and rounded) so rarity never deepens a penalty (e.g. armor SPD -2).
 * @param value Base stat value.
 * @param multiplier Rarity multiplier (see `RARITY_STAT_MULTIPLIER`).
 * @returns The scaled, rounded value for positives; the original value otherwise.
 */
export function scaleStat(value: number, multiplier: number): number {
  return value > 0 ? Math.round(value * multiplier) : value;
}

/**
 * Get the stat multiplier for a rarity tier.
 * @param rarity Rarity tier (defaults to common when undefined).
 */
export function getRarityMultiplier(rarity: RarityTier | undefined): number {
  return RARITY_STAT_MULTIPLIER[rarity ?? DEFAULT_RARITY];
}

/**
 * Get the display color for a rarity tier.
 * @param rarity Rarity tier (defaults to common when undefined).
 */
export function getRarityColor(rarity: RarityTier | undefined): string {
  return RARITY_COLORS[rarity ?? DEFAULT_RARITY];
}

/**
 * Get the display label for a rarity tier.
 * @param rarity Rarity tier (defaults to common when undefined).
 */
export function getRarityLabel(rarity: RarityTier | undefined): string {
  return RARITY_LABELS[rarity ?? DEFAULT_RARITY];
}
