/**
 * Pure economy helpers for the blacksmith (salvage, upgrade) and shop (sell).
 * All values derive from the item's own `cost` and the tunable constants in
 * `~/constants/blacksmith`, so balancing only ever means editing those constants.
 */

import type { Resources } from '~/types/resources';
import type { BaseItemData, EquipmentItemData } from '~/types/inventory';
import type { RarityTier } from '~/constants/rarity';
import { createResources } from '~/lib/resources';
import { canUpgradeRarity } from '~/lib/rarity';
import { SALVAGE_RETURN_RATIO, UPGRADE_COSTS, type UpgradableTier } from '~/constants/blacksmith';

/** The material bars refundable on salvage (the flat forge-fee coins are not). */
const SALVAGE_BARS = ['copper', 'silver', 'iron', 'gold'] as const;

/**
 * Materials returned when an equipment instance is scrapped: a fraction
 * ({@link SALVAGE_RETURN_RATIO}) of each material bar in the item's cost,
 * floored, with a minimum of 1 for any bar the recipe actually used. The flat
 * forge-fee coins are never refunded.
 * @param item Equipment definition being salvaged.
 * @returns Resources to credit the player.
 */
export function getSalvageReturn(item: EquipmentItemData): Resources {
  const refund = createResources();
  for (const bar of SALVAGE_BARS) {
    const cost = item.cost[bar];
    if (cost > 0) refund[bar] = Math.max(1, Math.floor(cost * SALVAGE_RETURN_RATIO));
  }
  return refund;
}

/**
 * Coin cost to upgrade an instance up one rarity tier. Returns an empty cost for
 * a maxed (legendary) item, which the UI should treat as not upgradable.
 * @param rarity Current rarity of the instance.
 * @returns The upgrade cost.
 */
export function getUpgradeCost(rarity: RarityTier): Resources {
  return canUpgradeRarity(rarity) ? UPGRADE_COSTS[rarity as UpgradableTier] : createResources();
}

/**
 * Coins paid out when selling an item back to the shop: half its coin value,
 * rounded down, with a guaranteed minimum of 1.
 * @param item Item being sold.
 * @returns Sale price in coins.
 */
export function getSellPrice(item: BaseItemData): number {
  return Math.max(1, Math.floor(item.cost.coins / 2));
}
