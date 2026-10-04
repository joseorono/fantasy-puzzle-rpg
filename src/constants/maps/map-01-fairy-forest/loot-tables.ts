import type { LootTable } from '~/types/loot';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { ProbabilityNumber } from '~/types/number-types';

/**
 * Loot table for Mossy Chest (fairy_forest_treasure_1) — the starter chest by the spawn clearing
 */
export const MOSSY_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-armor')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 120,
      gold: 0,
      copper: 6,
      silver: 0,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Willow Hollow Chest (fairy_forest_treasure_2)
 */
export const WILLOW_HOLLOW_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-staff')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 200,
      gold: 0,
      copper: 0,
      silver: 2,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Fairy Cache (fairy_forest_treasure_3)
 */
export const FAIRY_CACHE_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-longbow')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'row-clear')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 250,
      gold: 1,
      copper: 0,
      silver: 2,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Thornwood Chest (fairy_forest_treasure_4)
 */
export const THORNWOOD_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-sword')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'column-clear')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 300,
      gold: 1,
      copper: 0,
      silver: 3,
      iron: 4,
    },
    probability: 1 as ProbabilityNumber,
  },
};
