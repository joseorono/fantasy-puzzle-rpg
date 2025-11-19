import type { Resources } from './resources';
import type { EquipmentItemData, ConsumableItemData } from './inventory';

/**
 * Loot table structure for treasure chests and rewards
 */
export interface LootTable {
  /** Equipment items in the loot */
  equipableItems: EquipmentItemData[];
  /** Consumable items in the loot */
  consumableItems: ConsumableItemData[];
  /** Resources (currency) in the loot */
  resources: Resources;
}

/**
 * Create an empty loot table with safe defaults
 */
export function createEmptyLootTable(): LootTable {
  return {
    equipableItems: [],
    consumableItems: [],
    resources: {
      coins: 0,
      gold: 0,
      copper: 0,
      silver: 0,
      bronze: 0,
    },
  };
}

/**
 * Create a loot table with specified rewards
 */
export function createLootTable(
  equipableItems: EquipmentItemData[] = [],
  consumableItems: ConsumableItemData[] = [],
  resources: Partial<Resources> = {},
): LootTable {
  return {
    equipableItems,
    consumableItems,
    resources: {
      coins: resources.coins ?? 0,
      gold: resources.gold ?? 0,
      copper: resources.copper ?? 0,
      silver: resources.silver ?? 0,
      bronze: resources.bronze ?? 0,
    },
  };
}
