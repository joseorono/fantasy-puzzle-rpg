import type { Resources } from '~/types/resources';
import type { FloorLootSpot } from '~/types/floor-loot';
import { randIntInRange } from './math';

/**
 * Generate random resources based on max values using randIntInRange
 * @param maxValues Maximum values for each resource type
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
 * Get floor loot spot at a specific position
 * @param lootSpots Array of floor loot spots
 * @param row Row position
 * @param col Column position
 * @returns Floor loot spot if found, undefined otherwise
 */
export function getFloorLootAtPosition(
  lootSpots: FloorLootSpot[],
  row: number,
  col: number,
): FloorLootSpot | undefined {
  return lootSpots.find((spot) => spot.position.row === row && spot.position.col === col);
}

/**
 * Check if resources have any non-zero values
 * @param resources Resources to check
 * @returns True if any resource value is greater than 0
 */
export function hasNonZeroResources(resources: Resources): boolean {
  return (
    resources.coins > 0 || resources.gold > 0 || resources.copper > 0 || resources.silver > 0 || resources.bronze > 0
  );
}

/**
 * Filter resources to only include non-zero values
 * @param resources Resources to filter
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
