import type { MapDefinition } from '~/types/map';
import { newMap } from './tiled-data';
import { TILESET_FAIRY_FOREST } from '../tileset-data';
import { FAIRY_FOREST_NODES } from './nodes';
import { FAIRY_FOREST_FLOOR_LOOT } from './floor-loot';
import { FAIRY_FOREST_DIALOGUE_SCENES, FAIRY_FOREST_DIALOGUE_TRIGGERS } from './dialogue';
import { FAIRY_FOREST_ENCOUNTERS } from './encounters';

/** 120×80 forest trail — only the `road` layer is walkable. */
export const MAP_01_FAIRY_FOREST: MapDefinition = {
  id: 'map-01-fairy-forest',
  tilesetImage: TILESET_FAIRY_FOREST.image,
  displayMapName: 'Fairy Forest',
  walkableLayers: ['road'],
  visibleLayers: [
    'base-floor',
    'road',
    'mountains',
    'trees',
    'trees-2',
    'plants',
    'stones',
    'stones-2',
    'bushes',
    'flowers',
  ],
  defaultPlayerPosition: { x: 35, y: 39 },
  debug: true,
  tiledData: newMap,
  nodes: FAIRY_FOREST_NODES,
  floorLoot: FAIRY_FOREST_FLOOR_LOOT,
  dialogueTriggers: FAIRY_FOREST_DIALOGUE_TRIGGERS,
  dialogueScenes: FAIRY_FOREST_DIALOGUE_SCENES,
  encounters: FAIRY_FOREST_ENCOUNTERS,
};
