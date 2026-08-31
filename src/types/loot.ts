import type { Resources } from './resources';
import type { EquipmentItemData, ConsumableItemData } from './inventory';
import type { ProbabilityNumber } from './number-types';
import type { RarityTier } from '~/constants/rarity';

/**
 * Loot item with probability of being included.
 *
 * `rarity` is set when an equipment drop is *materialized* (rolled once at battle
 * end / chest open) so the rewards UI and the inventory grant agree on the tier.
 */
export interface LootItem<T> {
  item: T;
  probability: ProbabilityNumber;
  rarity?: RarityTier;
}

/**
 * Loot table structure for treasure chests and rewards
 */
export interface LootTable {
  /** Equipment items in the loot with drop probabilities */
  equipableItems: LootItem<EquipmentItemData>[];
  /** Consumable items in the loot with drop probabilities */
  consumableItems: LootItem<ConsumableItemData>[];
  /** Resources (currency) in the loot with drop probabilities */
  resources: LootItem<Resources>;
}

/**
 * Create an empty loot table with safe defaults
 */
export function createEmptyLootTable(): LootTable {
  return {
    equipableItems: [],
    consumableItems: [],
    resources: {
      item: {
        coins: 0,
        gold: 0,
        copper: 0,
        silver: 0,
        iron: 0,
      },
      probability: 1 as ProbabilityNumber,
    },
  };
}

/**
 * Create a loot table with specified rewards
 * @param equipableItems - Equipment items with optional probabilities (defaults to 1.0)
 * @param consumableItems - Consumable items with optional probabilities (defaults to 1.0)
 * @param resources - Resources with optional probability (defaults to 1.0)
 */
export function createLootTable(
  equipableItems: Array<{ item: EquipmentItemData; probability?: ProbabilityNumber }> = [],
  consumableItems: Array<{ item: ConsumableItemData; probability?: ProbabilityNumber }> = [],
  resources: { item?: Partial<Resources>; probability?: ProbabilityNumber } = {},
): LootTable {
  return {
    equipableItems: equipableItems.map((entry) => ({
      item: entry.item,
      probability: entry.probability ?? (1 as ProbabilityNumber),
    })),
    consumableItems: consumableItems.map((entry) => ({
      item: entry.item,
      probability: entry.probability ?? (1 as ProbabilityNumber),
    })),
    resources: {
      item: {
        coins: resources.item?.coins ?? 0,
        gold: resources.item?.gold ?? 0,
        copper: resources.item?.copper ?? 0,
        silver: resources.item?.silver ?? 0,
        iron: resources.item?.iron ?? 0,
      },
      probability: resources.probability ?? (1 as ProbabilityNumber),
    },
  };
}
