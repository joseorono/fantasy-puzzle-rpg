/**
 * Pure functions for currency/resource operations
 */

import type { Resources } from '../types/resources';
import { MAX_AMOUNT_PER_ITEM } from '../constants/inventory';

/**
 * Create a Resources object with zero values, optionally overriding specific resources
 * @param overrides - Partial resources to override defaults
 * @returns Complete Resources object
 */
export function createResources(overrides: Partial<Resources> = {}): Resources {
  return {
    coins: 0,
    gold: 0,
    copper: 0,
    silver: 0,
    bronze: 0,
    ...overrides,
  };
}

/**
 * Check if available resources meet or exceed required cost
 * @param available - Current resources available
 * @param cost - Required cost (as Resources)
 * @returns true if available resources meet or exceed cost
 */
export function canAfford(available: Resources, cost: Resources): boolean {
  return available.coins >= cost.coins &&
         available.gold >= cost.gold &&
         available.copper >= cost.copper &&
         available.silver >= cost.silver &&
         available.bronze >= cost.bronze;
}

/**
 * Calculate remaining resources after a purchase
 * @param available - Current resources
 * @param cost - Cost to deduct (as Resources)
 * @returns New resources object with cost deducted
 */
export function deductCost(available: Resources, cost: Resources): Resources {
  return {
    coins: Math.max(0, available.coins - cost.coins),
    gold: Math.max(0, available.gold - cost.gold),
    copper: Math.max(0, available.copper - cost.copper),
    silver: Math.max(0, available.silver - cost.silver),
    bronze: Math.max(0, available.bronze - cost.bronze),
  };
}

/**
 * Add resources (e.g., from rewards, loot)
 * @param available - Current resources
 * @param reward - Resources to add
 * @returns New resources object with reward added
 */
export function addResources(available: Resources, reward: Resources): Resources {
  return {
    coins: available.coins + reward.coins,
    gold: available.gold + reward.gold,
    copper: available.copper + reward.copper,
    silver: available.silver + reward.silver,
    bronze: available.bronze + reward.bronze,
  };
}

/**
 * Validate that an amount is non-negative
 * @param amount - Amount to validate
 * @returns Validated amount (minimum 0)
 */
export function validateGoldAmount(amount: number): number {
  return Math.max(0, Math.floor(amount));
}

/**
 * Calculate how many times a cost can be afforded
 * @param available - Current resources
 * @param cost - Required cost per unit (as Resources)
 * @returns Number of times the cost can be afforded (based on limiting resource), capped at MAX_AMOUNT_PER_ITEM
 */
export function howManyCanAfford(available: Resources, cost: Resources): number {
  let maxCount = MAX_AMOUNT_PER_ITEM;

  // Check each resource type
  for (const [key, costAmount] of Object.entries(cost)) {
    // handles costs of 0 by skipping them entirely
    if (costAmount > 0) {
      const availableAmount = available[key as keyof Resources];
      const affordableCount = Math.floor(availableAmount / costAmount);
      maxCount = Math.min(maxCount, affordableCount);

      // Early return if we can't afford any
      if (maxCount === 0) return 0;
    }
  }

  return maxCount;
}
