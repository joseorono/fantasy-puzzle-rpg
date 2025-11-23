import type { LootTable } from '~/types/loot';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { ProbabilityNumber } from '~/types/number-types';

/**
 * Loot table for Ancient Chest (treasure_1)
 */
export const ANCIENT_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'iron-sword')!,
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
      coins: 100,
      gold: 0,
      copper: 5,
      silver: 0,
      bronze: 3,
    },
    probability: 1 as ProbabilityNumber,
  },
};

/**
 * Loot table for Hidden Treasure Chest (treasure_2)
 */
export const HIDDEN_TREASURE_CHEST_LOOT: LootTable = {
  equipableItems: [
    {
      item: EquipmentItems.find((item) => item.id === 'bronze-daggers')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  consumableItems: [
    {
      item: ConsumableItems.find((item) => item.id === 'potion')!,
      probability: 1 as ProbabilityNumber,
    },
    {
      item: ConsumableItems.find((item) => item.id === 'high-potion')!,
      probability: 1 as ProbabilityNumber,
    },
  ],
  resources: {
    item: {
      coins: 250,
      gold: 0,
      copper: 0,
      silver: 2,
      bronze: 5,
    },
    probability: 1 as ProbabilityNumber,
  },
};
