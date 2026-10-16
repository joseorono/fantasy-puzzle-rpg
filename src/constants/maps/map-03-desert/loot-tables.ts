import type { LootTable } from '~/types/loot';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { ProbabilityNumber } from '~/types/number-types';

/**
 * Loot table for Dune Cache (desert_treasure_1) — the first chest past the southern entrance
 */
export const DUNE_CACHE_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-rod')!,
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
      coins: 280,
      gold: 0,
      copper: 6,
      silver: 2,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Tusk Chest (desert_treasure_2) — among the southern bones
 */
export const TUSK_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-composite-bow')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 320,
      gold: 0,
      copper: 4,
      silver: 3,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Badlands Chest (desert_treasure_3) — the south-west cliff corner
 */
export const BADLANDS_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-staff')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'row-clear')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 340,
      gold: 1,
      copper: 5,
      silver: 2,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Ruins Chest (desert_treasure_4) — among the pillars of the ruins' west hall
 */
export const RUINS_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-sword')!,
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
      coins: 380,
      gold: 1,
      copper: 0,
      silver: 4,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Pharaoh’s Coffer (desert_treasure_5) — the back corridor of the ruins
 */
export const PHARAOHS_COFFER_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-armor')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: EquipmentItems.find((item) => item.id === 'golden-scepter')!,
      probability: 0.5 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 450,
      gold: 2,
      copper: 0,
      silver: 4,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Ossuary Chest (desert_treasure_6) — beside the great tusks in the north
 */
export const OSSUARY_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'golden-war-bow')!,
      probability: 0.5 as ProbabilityNumber,
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
      coins: 400,
      gold: 1,
      copper: 6,
      silver: 3,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Sandstone Cache (desert_treasure_7) — under the dead trees by the north shrine
 */
export const SANDSTONE_CACHE_LOOT: LootTable = {
  equipableItems: [],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'column-clear')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 360,
      gold: 2,
      copper: 0,
      silver: 3,
      iron: 4,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Obelisk Hoard (desert_treasure_8) — the far north-east shrine, the deepest chest
 */
export const OBELISK_HOARD_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'golden-broadsword')!,
      probability: 0.5 as ProbabilityNumber,
    },
    {
      item: EquipmentItems.find((item) => item.id === 'golden-holy-rod')!,
      probability: 0.5 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 500,
      gold: 3,
      copper: 0,
      silver: 5,
      iron: 0,
    },
    probability: 1 as ProbabilityNumber,
  },
};
