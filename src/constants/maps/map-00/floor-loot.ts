import type { FloorLootSpot } from '~/types/floor-loot';
import { createFloorLootSpot } from '~/types/floor-loot';

/**
 * Floor loot spots on the demo map
 * These are scattered collectible resources on walkable tiles
 */
export const DEMO_FLOOR_LOOT: FloorLootSpot[] = [
  createFloorLootSpot('floor_loot_1', 51, 70, {
    coins: 50,
    copper: 3,
  }),
  createFloorLootSpot('floor_loot_2', 45, 70, {
    coins: 30,
    bronze: 2,
  }),
  createFloorLootSpot('floor_loot_3', 37, 71, {
    coins: 75,
    copper: 5,
    bronze: 1,
  }),
  createFloorLootSpot('floor_loot_4', 31, 79, {
    coins: 100,
    silver: 1,
  }),
  createFloorLootSpot('floor_loot_5', 41, 61, {
    coins: 60,
    copper: 4,
  }),
  createFloorLootSpot('floor_loot_6', 44, 54, {
    coins: 120,
    bronze: 3,
    silver: 1,
  }),
  createFloorLootSpot('floor_loot_7', 39, 40, {
    coins: 80,
    copper: 6,
  }),
  createFloorLootSpot('floor_loot_8', 41, 30, {
    coins: 150,
    silver: 2,
    gold: 1,
  }),
  createFloorLootSpot('floor_loot_9', 47, 25, {
    coins: 90,
    copper: 5,
    bronze: 2,
  }),
  createFloorLootSpot('floor_loot_10', 34, 18, {
    coins: 110,
    silver: 1,
    copper: 3,
  }),
  createFloorLootSpot('floor_loot_11', 15, 9, {
    coins: 200,
    gold: 1,
    silver: 2,
  }),
  createFloorLootSpot('floor_loot_12', 20, 22, {
    coins: 85,
    bronze: 4,
    copper: 2,
  }),
  createFloorLootSpot('floor_loot_13', 16, 44, {
    coins: 130,
    silver: 1,
    bronze: 3,
  }),
];

/**
 * Get floor loot spot by ID
 */
export function getFloorLootById(id: string): FloorLootSpot | undefined {
  return DEMO_FLOOR_LOOT.find((spot) => spot.id === id);
}

/**
 * Get floor loot spot at a specific position
 */
export function getFloorLootAtPosition(row: number, col: number): FloorLootSpot | undefined {
  return DEMO_FLOOR_LOOT.find((spot) => spot.position.row === row && spot.position.col === col);
}
