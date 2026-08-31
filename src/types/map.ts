import type { TilemapData, TiledMapConfig } from './tilemap';
import type { InteractiveMapNode, EncounterDefinition, FloorLootSpot } from './map-node';
import type { DialogueScene } from './dialogue';

/**
 * Every map in the game. Adding one means adding a member here and an entry in
 * MAP_REGISTRY — TypeScript flags a half-added map at both ends.
 */
export type MapId = 'map-00' | 'map-01';

/**
 * A dialogue scene that fires when the player steps onto a tile.
 * `scene` keys into the owning map's `dialogueScenes`.
 */
export interface DialogueTrigger {
  row: number;
  col: number;
  scene: string;
}

/**
 * Everything the tilemap needs to render and run a map: the Tiled export, the
 * rendering/walkability config, and the gameplay content laid over it.
 *
 * All content is optional — a map with none of it is a walkable space with no nodes,
 * events or loot, which is exactly what a fresh map starts as.
 */
export interface MapDefinition extends TiledMapConfig {
  id: MapId;
  tiledData: TilemapData;
  /** Interactive nodes (battles, towns, dungeons, chests) placed on the grid. */
  nodes?: InteractiveMapNode[];
  /** Auto-collected resource pickups. */
  floorLoot?: FloorLootSpot[];
  /** Tiles that prompt a dialogue scene on entry. */
  dialogueTriggers?: DialogueTrigger[];
  /** Scenes referenced by `dialogueTriggers` and by nodes' `dialogueScene`. */
  dialogueScenes?: Record<string, DialogueScene>;
  /** Enemy compositions, keyed by the node id that starts the fight. */
  encounters?: Record<string, EncounterDefinition>;
}
