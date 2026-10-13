import type { InteractiveMapNode } from '~/types/map-node';
import { EMBER_CRATE_LOOT, QUENCH_STASH_LOOT, SCRAP_CACHE_LOOT } from './loot-tables';

/**
 * Interactive nodes in the Apprentice Forge. Every position sits on a reachable `road` tile.
 * Ids are prefixed because map progress is keyed by node id across all maps.
 *
 * Gates (`blocksMovement`) fill both tiles of a 2-wide chokepoint: the exit opens only once
 * Cinder Watch and Bone Sentries are beaten, and Scrap Corridor guards the cache above it.
 */
export const APPRENTICE_FORGE_NODES: InteractiveMapNode[] = [
  // ─── Gates on the main path ─────────────────────────────────────────
  {
    id: 'apprentice_forge_battle_5',
    type: 'Battle',
    // The west corridor: the only way from the upper halls down to the south.
    position: [
      { row: 20, col: 3 },
      { row: 20, col: 4 },
    ],
    name: 'Cinder Watch',
    blocksMovement: true,
    description: 'Something still keeps watch over the stair down to the quenching halls',
  },
  {
    id: 'apprentice_forge_battle_4',
    type: 'Battle',
    // The only way into the exit hall.
    position: [
      { row: 26, col: 24 },
      { row: 26, col: 25 },
    ],
    name: 'Bone Sentries',
    blocksMovement: true,
    description: 'Two skeletons still stand guard over a forge long gone cold',
  },

  // ─── Side fights ────────────────────────────────────────────────────
  {
    id: 'apprentice_forge_battle_1',
    type: 'Battle',
    position: { row: 10, col: 40 },
    name: 'Ember Roost',
    blocksMovement: false,
    description: 'Wings flutter in the heat above the cooling racks',
  },
  {
    id: 'apprentice_forge_battle_2',
    type: 'Battle',
    // Seals the pocket with the Scrap Cache.
    position: [
      { row: 12, col: 2 },
      { row: 12, col: 1 },
    ],
    name: 'Scrap Corridor',
    blocksMovement: true,
    description: 'Old armour rattles in the dark, and it is not empty',
  },
  {
    id: 'apprentice_forge_battle_3',
    type: 'Battle',
    position: [
      { row: 28, col: 7 },
      { row: 28, col: 6 },
    ],
    name: 'Quench Pit',
    blocksMovement: false,
    description: 'Something gelatinous has settled in the quenching water',
  },

  // ─── Chests ─────────────────────────────────────────────────────────
  {
    id: 'apprentice_forge_treasure_1',
    type: 'Treasure',
    position: { row: 10, col: 2 },
    name: 'Scrap Cache',
    blocksMovement: false,
    description: 'A tool chest buried under the scrap, its lock rusted through',
    lootPayload: SCRAP_CACHE_LOOT,
  },
  {
    id: 'apprentice_forge_treasure_2',
    type: 'Treasure',
    position: { row: 29, col: 9 },
    name: 'Quench Stash',
    blocksMovement: false,
    description: 'A crate of supplies left beside the quenching trough',
    lootPayload: QUENCH_STASH_LOOT,
  },
  {
    id: 'apprentice_forge_treasure_3',
    type: 'Treasure',
    position: { row: 7, col: 44 },
    name: 'Ember Crate',
    blocksMovement: false,
    description: 'A crate pushed to the far end of the cooling racks',
    lootPayload: EMBER_CRATE_LOOT,
  },

  // ─── Exit ───────────────────────────────────────────────────────────
  {
    id: 'apprentice_forge_next_map',
    type: 'NextMap',
    position: { row: 24, col: 38 },
    name: 'Forge Stairs',
    blocksMovement: false,
    description: 'Worn steps climb toward daylight and the smell of moss',
    destination: { mapId: 'map-01-fairy-forest', arrival: { row: 72, col: 115 } },
  },
];
