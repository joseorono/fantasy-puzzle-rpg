import type { InteractiveMapNode } from '~/types/map-node';
import {
  DUNE_CACHE_LOOT,
  TUSK_CHEST_LOOT,
  BADLANDS_CHEST_LOOT,
  RUINS_CHEST_LOOT,
  PHARAOHS_COFFER_LOOT,
  OSSUARY_CHEST_LOOT,
  SANDSTONE_CACHE_LOOT,
  OBELISK_HOARD_LOOT,
} from './loot-tables';

/**
 * Interactive nodes in the Desert. Every position sits on a reachable `road` tile.
 * Ids are prefixed because map progress is keyed by node id across all maps.
 *
 * The player enters from the south edge and leaves from the north-east; chests sit on open ground and get richer
 * the farther they are from the entrance. The two `royal` chests can drop golden gear.
 */
export const DESERT_NODES: InteractiveMapNode[] = [
  // ─── Exits ──────────────────────────────────────────────────────────
  {
    id: 'desert_previous_map',
    type: 'PreviousMap',
    position: { row: 75, col: 83 },
    name: 'Willow Gate',
    blocksMovement: false,
    description: 'The willow gate back into the Fairy Forest',
    destination: { mapId: 'map-01-fairy-forest', arrival: { row: 2, col: 1 } },
  },
  {
    id: 'desert_next_map',
    type: 'NextMap',
    position: { row: 13, col: 118 },
    name: 'Garden Road',
    blocksMovement: false,
    description: 'A road leading out of the dunes toward a castle garden',
    destination: { mapId: 'map-02-castle-garden', arrival: { row: 4, col: 1 } },
  },

  // ─── South dunes ────────────────────────────────────────────────────
  {
    id: 'desert_treasure_1',
    type: 'Treasure',
    position: { row: 64, col: 92 },
    name: 'Dune Cache',
    blocksMovement: false,
    description: 'A chest half-buried among the desert shrubs',
    lootPayload: DUNE_CACHE_LOOT,
  },
  {
    id: 'desert_treasure_2',
    type: 'Treasure',
    position: { row: 54, col: 60 },
    name: 'Tusk Chest',
    blocksMovement: false,
    description: 'A chest left above a nest of bleached tusks',
    lootPayload: TUSK_CHEST_LOOT,
  },
  {
    id: 'desert_treasure_3',
    type: 'Treasure',
    position: { row: 64, col: 11 },
    name: 'Badlands Chest',
    blocksMovement: false,
    description: 'A chest left at the foot of a lone obelisk',
    lootPayload: BADLANDS_CHEST_LOOT,
  },

  // ─── Ruins ──────────────────────────────────────────────────────────
  {
    id: 'desert_treasure_4',
    type: 'Treasure',
    position: { row: 21, col: 5 },
    name: 'Ruins Chest',
    blocksMovement: false,
    description: 'A chest tucked between crumbling pillars',
    lootPayload: RUINS_CHEST_LOOT,
  },
  {
    id: 'desert_treasure_5',
    type: 'Treasure',
    position: { row: 14, col: 14 },
    name: 'Pharaoh’s Coffer',
    blocksMovement: false,
    description: 'A gilded coffer sealed at the back of the ruins',
    lootPayload: PHARAOHS_COFFER_LOOT,
    chestVariant: 'royal',
  },

  // ─── North dunes ────────────────────────────────────────────────────
  {
    id: 'desert_treasure_6',
    type: 'Treasure',
    position: { row: 10, col: 55 },
    name: 'Ossuary Chest',
    blocksMovement: false,
    description: 'A chest resting in the shadow of a giant tusk',
    lootPayload: OSSUARY_CHEST_LOOT,
  },
  {
    id: 'desert_treasure_7',
    type: 'Treasure',
    position: { row: 16, col: 83 },
    name: 'Sandstone Cache',
    blocksMovement: false,
    description: 'A sand-scoured chest beneath the dead trees',
    lootPayload: SANDSTONE_CACHE_LOOT,
  },
  {
    id: 'desert_treasure_8',
    type: 'Treasure',
    position: { row: 8, col: 106 },
    name: 'Obelisk Hoard',
    blocksMovement: false,
    description: 'An offering chest at the feet of the twin obelisks',
    lootPayload: OBELISK_HOARD_LOOT,
    chestVariant: 'royal',
  },
];
