import type { Resources } from './resources';

/**
 * Floor loot spot definition for scattered collectible resources on the map
 */
export interface FloorLootSpot {
  /** Unique identifier for this floor loot spot */
  id: string;
  /** Position on the map grid */
  position: {
    row: number;
    col: number;
  };
  /** Maximum values for random resource generation */
  maxValues: Resources;
  /** Whether this loot has been collected (runtime state, not persisted here) */
  isCollected?: boolean;
}

/**
 * Helper to create a floor loot spot with default values
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
