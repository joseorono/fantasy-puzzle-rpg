import type { LootTable } from '~/types/loot';
import type { ProbabilityNumber } from '~/types/number-types';

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
      bronze: 1,
    },
    probability: 1 as ProbabilityNumber,
  },
};
