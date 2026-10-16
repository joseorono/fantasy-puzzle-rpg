import type { MapDefinition } from '~/types/map';
import { map03DesertTiledData } from './tiled-data';
import { TILESET_DESERT } from '../tileset-data';
import { DESERT_FLOOR_LOOT } from './floor-loot';
import { DESERT_NODES } from './nodes';

export const MAP_03_DESERT: MapDefinition = {
  id: 'map-03-desert',
  tilesetImage: TILESET_DESERT.image,
  displayMapName: 'Desert',
  walkableLayers: ['road'],
  // Visible-surface rule: a road cell is only walkable when the sand or the road itself is
  // what's drawn on top — pyramids, mountains, bones, cactus and obelisks over the road block it,
  // except the bone arcs in `TILESET_DESERT.overheadGids`, which the player walks under.
  surfaceLayers: ['base-floor'],
  visibleLayers: ['base-floor', 'road', 'pyramids', 'mountains and bones', 'cactus', 'obelisk'],
  // The south edge, beside the exit back to the Fairy Forest.
  defaultPlayerPosition: { x: 83, y: 74 },
  debug: true,
  footstepVolume: 0.6,
  footstepPitch: 0.92,
  tiledData: map03DesertTiledData,
  nodes: DESERT_NODES,
  floorLoot: DESERT_FLOOR_LOOT,
};
