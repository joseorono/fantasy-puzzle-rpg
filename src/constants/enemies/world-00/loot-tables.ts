import type { LootTable } from '~/types/loot';
import type { ProbabilityNumber } from '~/types/number-types';
import { ConsumableItems, EquipmentItems } from '~/constants/inventory';

/**
 * Loot table for Moss Golem
 */
export const MOSS_GOLEM_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 50,
      gold: 0,
      copper: 2,
      silver: 0,
      iron: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Swamp Frog
 */
export const SWAMP_FROG_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 15,
      gold: 0,
      copper: 1,
      silver: 0,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Stone Golem — a roaming FOE, so it pays out like a small chest
 */
export const STONE_GOLEM_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'iron-armor')!,
      probability: 0.35 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'potion')!,
      probability: 0.5 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 160,
      gold: 0,
      copper: 5,
      silver: 1,
      iron: 4,
    },
    probability: 1 as ProbabilityNumber,
  },
};
