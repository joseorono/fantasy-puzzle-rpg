import type { LootTable } from '~/types/loot';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { ProbabilityNumber } from '~/types/number-types';

/**
 * Loot table for Scrap Cache (apprentice_forge_treasure_1) — behind Scrap Corridor
 */
export const SCRAP_CACHE_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-sword')!,
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
      coins: 80,
      gold: 0,
      copper: 4,
      silver: 0,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Quench Stash (apprentice_forge_treasure_2)
 */
export const QUENCH_STASH_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 60,
      gold: 0,
      copper: 3,
      silver: 0,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Ember Crate (apprentice_forge_treasure_3)
 */
export const EMBER_CRATE_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-recurve-bow')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'row-clear')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 70,
      gold: 0,
      copper: 0,
      silver: 0,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};
