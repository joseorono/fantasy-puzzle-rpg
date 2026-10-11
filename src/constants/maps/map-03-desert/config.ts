import type { MapDefinition } from '~/types/map';
import { map03DesertTiledData } from './tiled-data';
import { TILESET_DESERT } from '../tileset-data';
import { DESERT_FLOOR_LOOT } from './floor-loot';

export const MAP_03_DESERT: MapDefinition = {
  id: 'map-03-desert',
  tilesetImage: TILESET_DESERT.image,
  displayMapName: 'Desert',
  walkableLayers: ['road'],
  // Visible-surface rule: a road cell is only walkable when the sand or the road itself is
  // what's drawn on top — pyramids, mountains, cactus and obelisks over the road block it.
  surfaceLayers: ['base-floor'],
  visibleLayers: ['base-floor', 'road', 'pyramids', 'mountains', 'cactus', 'obelisk'],
  defaultPlayerPosition: { x: 1, y: 40 },
  debug: true,
  tiledData: map03DesertTiledData,
  floorLoot: DESERT_FLOOR_LOOT,
};
