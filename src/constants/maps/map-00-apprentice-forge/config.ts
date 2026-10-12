import type { MapDefinition } from '~/types/map';
import { newMap } from './tiled-data';
import { TILESET_FORGE } from '../tileset-data';
import { APPRENTICE_FORGE_FLOOR_LOOT } from './floor-loot';
import { APPRENTICE_FORGE_NODES } from './nodes';
import { APPRENTICE_FORGE_ENCOUNTERS } from './encounters';
import { APPRENTICE_FORGE_FOES } from './foes';
import { APPRENTICE_FORGE_DIALOGUE_SCENES, APPRENTICE_FORGE_DIALOGUE_TRIGGERS } from './dialogue';

export const MAP_00_APPRENTICE_FORGE: MapDefinition = {
  id: 'map-00-apprentice-forge',
  tilesetImage: TILESET_FORGE.image,
  displayMapName: 'Apprentice Forge',
  walkableLayers: ['road'],
  visibleLayers: ['lava', 'details', 'statues', 'walls', 'road', 'chests, barrils and doors'],
  occlusionLayers: ['walls', 'statues'],
  // The door room, top-left; the tutorial events lead out of it.
  defaultPlayerPosition: { x: 4, y: 3 },
  debug: true,
  footstepVolume: 0.95,
  footstepPitch: 1.08,
  // 32px tiles: keep the same 40px body the 16px maps draw.
  characterBodyHeightTiles: 1.25,
  tiledData: newMap,
  nodes: APPRENTICE_FORGE_NODES,
  floorLoot: APPRENTICE_FORGE_FLOOR_LOOT,
  encounters: APPRENTICE_FORGE_ENCOUNTERS,
  foes: APPRENTICE_FORGE_FOES,
  dialogueTriggers: APPRENTICE_FORGE_DIALOGUE_TRIGGERS,
  dialogueScenes: APPRENTICE_FORGE_DIALOGUE_SCENES,
};
