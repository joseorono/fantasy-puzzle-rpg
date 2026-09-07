import type { MapDefinition } from '~/types/map';
import { newMap } from './tiled-data';
import { APPRENTICE_FORGE_FLOOR_LOOT } from './floor-loot';

export const MAP_00_APPRENTICE_FORGE: MapDefinition = {
  id: 'map-00-apprentice-forge',
  tilesetImage: '/assets/tileset/pc-forge-tileset.png',
  displayMapName: 'Apprentice Forge',
  walkableLayers: ['road'],
  visibleLayers: ['lava', 'details', 'statues', 'walls', 'road', 'chests, barrils and doors'],
  defaultPlayerPosition: { x: 35, y: 24 },
  debug: true,
  // 32px tiles: keep the same 42px body the 16px maps draw.
  characterBodyHeightTiles: 1.3125,
  tiledData: newMap,
  floorLoot: APPRENTICE_FORGE_FLOOR_LOOT,
};

