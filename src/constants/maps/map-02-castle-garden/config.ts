import type { MapDefinition } from '~/types/map';
import { map02CastleGardenTiledData } from './tiled-data';
import { TILESET_CASTLE_GARDEN } from '../tileset-data';

export const MAP_02_CASTLE_GARDEN: MapDefinition = {
  id: 'map-02-castle-garden',
  tilesetImage: TILESET_CASTLE_GARDEN.image,
  displayMapName: 'Castle Garden',
  walkableLayers: ['road'],
  // The visible-surface rule: a road cell is only walkable if what the player actually sees
  // on top is the road or one of these floors — transparent road tiles must not let the
  // player walk through grass, bushes or trees drawn underneath.
  surfaceLayers: ['base-floor', 'fountains-floor'],
  visibleLayers: [
    'base-floor',
    'fountains-floor',
    'trees-2',
    'bushes',
    'road',
    'chairs',
    'decoration',
    'fountains',
    'statues',
    'trees',
    'garden',
    'castle',
    'fountains-2',
    'decoration-2',
  ],
  defaultPlayerPosition: { x: 1, y: 4 },
  debug: true,
  tiledData: map02CastleGardenTiledData,
};
