import type { TilemapData, TiledMapConfig } from './tilemap';
import type { InteractiveMapNode, EncounterDefinition, FloorLootSpot } from './map-node';
import type { DialogueScene } from './dialogue';
import type { FoeDefinition } from './foe';
import type { JirbyColorSymbolName, JirbyWhiteSymbolName } from './jirby-symbols';

/**
 * Every map in the game. Adding one means adding a member here, an entry in
 * MAP_REGISTRY, and a key in `MAP_ID_COVERAGE` (src/types/save-game.ts) so the
 * id validates in saves — TypeScript flags a half-added map at every end.
 */
export type MapId = 'map-00' | 'map-01' | 'map-00-apprentice-forge' | 'map-01-fairy-forest' | 'map-02-castle-garden';

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
  /** Roaming enemies; each one's fight lives in `encounters` under `encounterId ?? id`. */
  foes?: FoeDefinition[];
}

/** The three shades of a node marker's plate, as CSS colours. */
export interface MarkerPlatePalette {
  fill: string;
  /** Top inner rows. */
  highlight: string;
  /** Bottom inner rows. */
  shade: string;
}

/** Look of a node marker: its symbol in each tone, and the plate it sits on. */
export interface MapNodeMarkerStyle {
  /** Drawn on the coloured plate, and on the map until the node is done. */
  symbol: JirbyColorSymbolName;
  /** Drawn on the grey plate once done, and as the minimap pin. */
  whiteSymbol: JirbyWhiteSymbolName;
  plate: MarkerPlatePalette;
}

/**
 * How a node marker draws. `doneActive` is a completed node the character stands on:
 * it relights in colour but keeps its check.
 */
export type NodeMarkerState = 'todo' | 'done' | 'doneActive';

/** What one pixel of a marker plate is painted as. */
export type PlatePixelRole = 'outline' | 'highlight' | 'fill' | 'shade';

/** Marker atlas sprites that aren't node plates: the floating symbols and the two ground shadows. */
export type MarkerAtlasExtra = 'floorLoot' | 'dialogueTrigger' | 'plateShadow' | 'floatShadow';
