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
  PITY_MAX,
  PITY_RESET_TIER,
} from '~/constants/rarity';
import { randFloatInRange } from '~/lib/math';

/**
 * Compute the (biased) relative drop weight of each rarity tier, in tier order.
 * Shared by `rollRarity` and `getRarityOdds` so the roll and the displayed odds
 * can never drift apart.
 * @param bias Source bias (0 reproduces `BASE_RARITY_WEIGHTS`; higher lifts rarer tiers).
 * @returns Relative weights aligned to `RARITY_TIERS`.
 */
export function getRarityWeights(bias: number = 0): number[] {
  return RARITY_TIERS.map((tier, index) => BASE_RARITY_WEIGHTS[tier] * (1 + bias * index * RARITY_BIAS_FACTOR));
}

/**
 * Roll a random rarity tier using the base weights, optionally biased toward
 * higher tiers.
 * @param bias Enemy/source bias (default 0). 0 reproduces `BASE_RARITY_WEIGHTS`;
 *   higher values lift the odds of rarer tiers (see `RARITY_BIAS_FACTOR`).
 * @returns A weighted-random rarity tier.
 */
export function rollRarity(bias: number = 0): RarityTier {
  const weights = getRarityWeights(bias);
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
 * Get the drop chance of each rarity tier as a percentage (summing to ~100),
 * for display in the crafting UI.
 * @param bias Source bias (e.g. the pity-adjusted craft bias).
 * @returns Percentage per tier.
 */
export function getRarityOdds(bias: number = 0): Record<RarityTier, number> {
  const weights = getRarityWeights(bias);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const odds = {} as Record<RarityTier, number>;
  RARITY_TIERS.forEach((tier, index) => {
    odds[tier] = total > 0 ? (weights[index] / total) * 100 : 0;
  });
  return odds;
}

/**
 * Whether a rarity tier can be upgraded another step (false only for legendary).
 */
export function canUpgradeRarity(rarity: RarityTier): boolean {
  return RARITY_TIERS.indexOf(rarity) < RARITY_TIERS.length - 1;
}

/**
 * The next rarity tier up, or the same tier if already at the cap (legendary).
 */
export function upgradeRarity(rarity: RarityTier): RarityTier {
  const index = RARITY_TIERS.indexOf(rarity);
  return canUpgradeRarity(rarity) ? RARITY_TIERS[index + 1] : rarity;
}

/**
 * Pure pity-counter transition for the crafting "bad luck protection".
 * A roll below `PITY_RESET_TIER` bumps the counter (clamped to `PITY_MAX`);
 * a roll at or above it resets the counter to 0.
 * @param currentPity Current pity counter.
 * @param rolledRarity The tier just crafted.
 * @returns The next pity counter value.
 */
export function nextPity(currentPity: number, rolledRarity: RarityTier): number {
  const resetIndex = RARITY_TIERS.indexOf(PITY_RESET_TIER);
  if (RARITY_TIERS.indexOf(rolledRarity) >= resetIndex) return 0;
  return Math.min(currentPity + 1, PITY_MAX);
}

/**
 * Scale a single stat value by a rarity multiplier. Only positive values are
 * scaled (and rounded) so rarity never deepens a penalty (e.g. armor SPD -2).
 * Any tier above common (`multiplier > 1`) guarantees at least +1 over the base
 * so low-value stats aren't lost to rounding.
 * @param value Base stat value.
 * @param multiplier Rarity multiplier (see `RARITY_STAT_MULTIPLIER`).
 * @returns The scaled value for positives; the original value otherwise.
 */
export function scaleStat(value: number, multiplier: number): number {
  if (value <= 0) return value;
  const scaled = Math.round(value * multiplier);
  return multiplier > 1 ? Math.max(scaled, value + 1) : scaled;
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
