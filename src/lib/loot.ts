import type { EnemyData } from '~/types/rpg-elements';
import type { LootTable } from '~/types/loot';
import type { ProbabilityNumber } from '~/types/number-types';
import { createEmptyLootTable } from '~/types/loot';

/**
 * Combines loot tables and XP rewards from multiple defeated enemies
 * into a single loot table and total expReward.
 *
 * Equipment and consumable loot items are concatenated from all enemies.
 * Resource amounts (coins, gold, copper, silver, bronze) are summed.
 * The combined resources probability is set to 1 (guaranteed drop).
 *
 * @param enemies - Array of defeated enemies whose loot should be merged
 * @returns Combined loot table and total experience reward, or an empty
 *   loot table with 0 exp if the array is empty
 */
export function combineLootFromEnemies(enemies: EnemyData[]): {
  lootTable: LootTable;
  expReward: number;
} {
  if (enemies.length === 0) {
    return { lootTable: createEmptyLootTable(), expReward: 0 };
  }

  const expReward = enemies.reduce((sum, enemy) => sum + enemy.expReward, 0);

  const equipableItems = enemies.flatMap((enemy) => enemy.lootTable.equipableItems);
  const consumableItems = enemies.flatMap((enemy) => enemy.lootTable.consumableItems);

  const resources = enemies.reduce(
    (acc, enemy) => {
      const r = enemy.lootTable.resources.item;
      return {
        coins: acc.coins + r.coins,
        gold: acc.gold + r.gold,
        copper: acc.copper + r.copper,
        silver: acc.silver + r.silver,
        bronze: acc.bronze + r.bronze,
      };
    },
    { coins: 0, gold: 0, copper: 0, silver: 0, bronze: 0 },
  );

  return {
    lootTable: {
      equipableItems,
      consumableItems,
      resources: {
        item: resources,
        probability: 1 as ProbabilityNumber,
      },
    },
    expReward,
  };
}
