import type { FloorLootSpot } from '~/types/map-node';
import { createFloorLootSpot } from '~/lib/loot';

/**
 * Floor loot scattered through the Apprentice Forge, roughly in walking order.
 * Every spot sits on a walkable `road` tile — positions are (row, col).
 */
export const APPRENTICE_FORGE_FLOOR_LOOT: FloorLootSpot[] = [
  // ─── Upper halls ────────────────────────────────────────────────────
  createFloorLootSpot('apprentice_forge_loot_1', 5, 0, { coins: 25, copper: 1 }),
  createFloorLootSpot('apprentice_forge_loot_2', 3, 30, { coins: 40, copper: 2 }),
  createFloorLootSpot('apprentice_forge_loot_3', 12, 33, { coins: 35, iron: 1 }),
  createFloorLootSpot('apprentice_forge_loot_4', 11, 43, { coins: 50, copper: 3 }),
  createFloorLootSpot('apprentice_forge_loot_5', 17, 24, { coins: 30, copper: 2 }),
  createFloorLootSpot('apprentice_forge_loot_6', 14, 1, { coins: 35, iron: 1 }),

  // ─── Quenching halls ────────────────────────────────────────────────
  createFloorLootSpot('apprentice_forge_loot_7', 25, 5, { coins: 40, copper: 2 }),
  createFloorLootSpot('apprentice_forge_loot_8', 28, 16, { coins: 45, iron: 2 }),
  createFloorLootSpot('apprentice_forge_loot_9', 23, 39, { coins: 50, copper: 3 }),
];
