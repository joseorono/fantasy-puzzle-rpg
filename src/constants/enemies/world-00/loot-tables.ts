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

/**
 * Loot table for the Giant Frog — a Fairy Forest FOE, so it also pays out like a small chest
 */
export const GIANT_FROG_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'iron-sword')!,
      probability: 0.3 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'potion')!,
      probability: 0.6 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 140,
      gold: 0,
      copper: 6,
      silver: 1,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Bat — trash-tier, a few coins
 */
export const BAT_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 10,
      gold: 0,
      copper: 0,
      silver: 0,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Small Slime — sturdy, so it pays a little more than its size suggests
 */
export const SMALL_SLIME_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 25,
      gold: 0,
      copper: 1,
      silver: 0,
      iron: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Skeleton
 */
export const SKELETON_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 30,
      gold: 0,
      copper: 0,
      silver: 0,
      iron: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Badger, the Fairy Forest's area boss
 */
export const BADGER_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-armor')!,
      probability: 0.35 as ProbabilityNumber,
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
      coins: 300,
      gold: 1,
      copper: 6,
      silver: 3,
      iron: 6,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Rider — a Castle Garden FOE, so it also pays out like a small chest
 */
export const RIDER_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'iron-armor')!,
      probability: 0.3 as ProbabilityNumber,
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
      coins: 150,
      gold: 0,
      copper: 4,
      silver: 1,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for the Brown Wolf — a regular beast, a few coins and scraps
 */
export const BROWN_WOLF_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [],
  resources: {
    item: {
      coins: 30,
      gold: 0,
      copper: 1,
      silver: 0,
      iron: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};
