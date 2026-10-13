import type { FloorLootSpot } from '~/types/map-node';
import { createFloorLootSpot } from '~/lib/loot';

/**
 * Floor loot scattered along the Fairy Forest trail.
 * Every spot sits on a walkable `road` tile — positions are (row, col).
 */
export const FAIRY_FOREST_FLOOR_LOOT: FloorLootSpot[] = [
  // ─── Spawn clearing ─────────────────────────────────────────────────
  createFloorLootSpot('fairy_forest_loot_11', 38, 29, {
    coins: 35,
    copper: 3,
  }),
  createFloorLootSpot('fairy_forest_loot_12', 42, 36, {
    coins: 45,
    copper: 2,
    iron: 1,
  }),
  createFloorLootSpot('fairy_forest_loot_13', 46, 27, {
    coins: 50,
    copper: 4,
  }),

  // ─── Trail ──────────────────────────────────────────────────────────
  createFloorLootSpot('fairy_forest_loot_1', 1, 10, {
    coins: 40,
    copper: 3,
  }),
  createFloorLootSpot('fairy_forest_loot_2', 13, 30, {
    coins: 60,
    copper: 4,
  }),
  createFloorLootSpot('fairy_forest_loot_3', 11, 90, {
    coins: 75,
    iron: 2,
  }),
  createFloorLootSpot('fairy_forest_loot_4', 30, 55, {
    coins: 90,
    copper: 5,
    iron: 1,
  }),
  createFloorLootSpot('fairy_forest_loot_5', 40, 78, {
    coins: 110,
    silver: 1,
  }),
  createFloorLootSpot('fairy_forest_loot_6', 46, 100, {
    coins: 95,
    iron: 3,
  }),
  createFloorLootSpot('fairy_forest_loot_7', 57, 50, {
    coins: 130,
    silver: 1,
    copper: 4,
  }),
  createFloorLootSpot('fairy_forest_loot_8', 65, 105, {
    coins: 120,
    iron: 4,
  }),
  createFloorLootSpot('fairy_forest_loot_9', 70, 36, {
    coins: 150,
    silver: 2,
  }),
  createFloorLootSpot('fairy_forest_loot_10', 72, 63, {
    coins: 180,
    gold: 1,
    silver: 1,
  }),

  // ─── Along the climb from the lower right ───────────────────────────
  createFloorLootSpot('fairy_forest_loot_14', 74, 115, { coins: 30, copper: 2 }),
  createFloorLootSpot('fairy_forest_loot_15', 75, 84, { coins: 40, copper: 3 }),
  createFloorLootSpot('fairy_forest_loot_16', 57, 86, { coins: 45, iron: 1 }),
  createFloorLootSpot('fairy_forest_loot_17', 49, 88, { coins: 60, copper: 3 }),
  createFloorLootSpot('fairy_forest_loot_18', 31, 66, { coins: 70, iron: 2 }),
  createFloorLootSpot('fairy_forest_loot_19', 15, 61, { coins: 110, silver: 1 }),
  createFloorLootSpot('fairy_forest_loot_20', 76, 35, { coins: 140, silver: 2 }),
  createFloorLootSpot('fairy_forest_loot_21', 53, 30, { coins: 90, copper: 4 }),
  createFloorLootSpot('fairy_forest_loot_22', 22, 14, { coins: 110, iron: 3 }),
  createFloorLootSpot('fairy_forest_loot_23', 9, 30, { coins: 120, silver: 1 }),
];
