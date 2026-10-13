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
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-rod')!,
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

/**
 * Loot table for Bramble Nook (fairy_forest_treasure_5) — the start pocket
 */
export const BRAMBLE_NOOK_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-staff')!,
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
      coins: 90,
      gold: 0,
      copper: 4,
      silver: 0,
      iron: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Canopy Hollow (fairy_forest_treasure_6) — top of the north band
 */
export const CANOPY_HOLLOW_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-rod')!,
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
      coins: 220,
      gold: 0,
      copper: 4,
      silver: 2,
      iron: 2,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Treant’s Hoard (fairy_forest_treasure_7) — beside the Elder Treant
 */
export const TREANTS_HOARD_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'silver-armor')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'energy-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 350,
      gold: 1,
      copper: 0,
      silver: 3,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Sunken Crate (fairy_forest_treasure_8) — deep in the south hollow
 */
export const SUNKEN_CRATE_LOOT: LootTable = {
  equipableItems: [],
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
      coins: 260,
      gold: 0,
      copper: 5,
      silver: 2,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Glimmer Cellar (fairy_forest_treasure_9) — behind Glimmerdell
 */
export const GLIMMER_CELLAR_LOOT: LootTable = {
  equipableItems: [],
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
      coins: 180,
      gold: 0,
      copper: 6,
      silver: 0,
      iron: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Root Cellar (fairy_forest_treasure_10) — the west lobe’s dead end
 */
export const ROOT_CELLAR_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'steel-armor')!,
      probability: 0.5 as ProbabilityNumber,
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
      coins: 240,
      gold: 0,
      copper: 0,
      silver: 2,
      iron: 4,
    },
    probability: 1 as ProbabilityNumber,
  },
};
