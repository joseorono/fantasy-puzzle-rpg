import type { MapDefinition } from '~/types/map';
import { demoMap } from './tiled-data';
import { DEMO_MAP_NODES } from './nodes';
import { DEMO_FLOOR_LOOT } from './floor-loot';
import { MAP_00_DIALOGUE_SCENES, MAP_00_DIALOGUE_TRIGGERS } from './dialogue';
import { MAP_00_ENCOUNTERS } from './encounters';

export const MAP_00: MapDefinition = {
  id: 'map-00',
  tilesetImage: '/assets/tileset/demo-map.png',
  displayMapName: 'Overworld',
  walkableLayers: ['road'],
  visibleLayers: ['Capa de patrones 1', 'road', 'mountains', 'trees', 'signs'],
  defaultPlayerPosition: { x: 70, y: 58 },
  debug: true,
  tiledData: demoMap,
  nodes: DEMO_MAP_NODES,
  floorLoot: DEMO_FLOOR_LOOT,
  dialogueTriggers: MAP_00_DIALOGUE_TRIGGERS,
  dialogueScenes: MAP_00_DIALOGUE_SCENES,
  encounters: MAP_00_ENCOUNTERS,
};
