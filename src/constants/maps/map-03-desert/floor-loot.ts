import type { FloorLootSpot } from '~/types/map-node';
import { createFloorLootSpot } from '~/lib/loot';

/**
 * Floor loot scattered across the Desert.
 * Every spot sits on a walkable `road` tile — positions are (row, col).
 */
export const DESERT_FLOOR_LOOT: FloorLootSpot[] = [
  // ─── Ruins ──────────────────────────────────────────────────────────
  createFloorLootSpot('desert_loot_1', 5, 20, {
    coins: 60,
    copper: 4,
  }),
  createFloorLootSpot('desert_loot_2', 18, 30, {
    coins: 110,
    silver: 2,
    iron: 1,
  }),

  // ─── North dunes ────────────────────────────────────────────────────
  createFloorLootSpot('desert_loot_3', 20, 58, {
    coins: 75,
    copper: 5,
  }),
  createFloorLootSpot('desert_loot_4', 5, 97, {
    coins: 90,
    iron: 2,
  }),
  createFloorLootSpot('desert_loot_5', 14, 117, {
    coins: 100,
    silver: 1,
    copper: 3,
  }),

  // ─── Canyon road ────────────────────────────────────────────────────
  createFloorLootSpot('desert_loot_6', 30, 75, {
    coins: 80,
    copper: 4,
    iron: 1,
  }),
  createFloorLootSpot('desert_loot_7', 37, 95, {
    coins: 95,
    iron: 2,
  }),
  createFloorLootSpot('desert_loot_8', 52, 30, {
    coins: 85,
    copper: 5,
  }),
  createFloorLootSpot('desert_loot_9', 54, 90, {
    coins: 105,
    silver: 1,
    iron: 1,
  }),

  // ─── South badlands ─────────────────────────────────────────────────
  createFloorLootSpot('desert_loot_10', 60, 45, {
    coins: 90,
    copper: 6,
  }),
  createFloorLootSpot('desert_loot_11', 66, 100, {
    coins: 120,
    silver: 2,
  }),
  createFloorLootSpot('desert_loot_12', 71, 83, {
    coins: 130,
    gold: 1,
    iron: 2,
  }),
];
