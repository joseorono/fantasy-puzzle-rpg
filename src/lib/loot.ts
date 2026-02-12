import type { EnemyData } from '~/types/rpg-elements';
import type { LootTable } from '~/types/loot';
import type { ProbabilityNumber } from '~/types/number-types';
import type { FloorLootSpot } from '~/types/map-node';
import type { Resources } from '~/types/resources';
import { createEmptyLootTable } from '~/types/loot';
import { randIntInRange } from './math';

// ─── Enemy Loot ───────────────────────────────────────────────────────

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

// ─── Floor Loot ───────────────────────────────────────────────────────

/**
 * Creates a floor loot spot with default resource values.
 * @param id - Unique identifier for the loot spot
 * @param row - Row position on the map grid
 * @param col - Column position on the map grid
 * @param maxValues - Maximum resource values for random generation (defaults to 0 for each)
 * @returns A FloorLootSpot definition
 */
export function createFloorLootSpot(
  id: string,
  row: number,
  col: number,
  maxValues: Partial<Resources> = {},
): FloorLootSpot {
  return {
    id,
    position: { row, col },
    maxValues: {
      coins: maxValues.coins ?? 0,
      gold: maxValues.gold ?? 0,
      copper: maxValues.copper ?? 0,
      silver: maxValues.silver ?? 0,
      bronze: maxValues.bronze ?? 0,
    },
  };
}

/**
 * Generate random resources based on max values using randIntInRange.
 * @param maxValues - Maximum values for each resource type
 * @returns Randomly generated resources (0 to maxValue for each type)
 */
export function generateRandomResources(maxValues: Resources): Resources {
  return {
    coins: maxValues.coins > 0 ? randIntInRange(0, maxValues.coins) : 0,
    gold: maxValues.gold > 0 ? randIntInRange(0, maxValues.gold) : 0,
    copper: maxValues.copper > 0 ? randIntInRange(0, maxValues.copper) : 0,
    silver: maxValues.silver > 0 ? randIntInRange(0, maxValues.silver) : 0,
    bronze: maxValues.bronze > 0 ? randIntInRange(0, maxValues.bronze) : 0,
  };
}

/**
 * Get floor loot spot at a specific position.
 * @param lootSpots - Array of floor loot spots
 * @param row - Row position
 * @param col - Column position
 * @returns Floor loot spot if found, undefined otherwise
 */
export function getFloorLootAtPosition(
  lootSpots: FloorLootSpot[],
  row: number,
  col: number,
): FloorLootSpot | undefined {
  return lootSpots.find((spot) => spot.position.row === row && spot.position.col === col);
}

// ─── Resource Utilities ───────────────────────────────────────────────

/**
 * Check if resources have any non-zero values.
 * @param resources - Resources to check
 * @returns True if any resource value is greater than 0
 */
export function hasNonZeroResources(resources: Resources): boolean {
  return (
    resources.coins > 0 || resources.gold > 0 || resources.copper > 0 || resources.silver > 0 || resources.bronze > 0
  );
}

/**
 * Filter resources to only include non-zero values.
 * @param resources - Resources to filter
 * @returns Object with only non-zero resource values
 */
export function filterNonZeroResources(resources: Resources): Partial<Resources> {
  const filtered: Partial<Resources> = {};
  if (resources.coins > 0) filtered.coins = resources.coins;
  if (resources.gold > 0) filtered.gold = resources.gold;
  if (resources.copper > 0) filtered.copper = resources.copper;
  if (resources.silver > 0) filtered.silver = resources.silver;
  if (resources.bronze > 0) filtered.bronze = resources.bronze;
  return filtered;
}
