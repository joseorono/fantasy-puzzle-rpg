// types/tilemap.ts
import type { Position } from './geometry';

export interface TilemapLayer {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TilemapTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
  source?: string;
  tiledversion?: string;
  type?: string;
  version?: string;
}

export interface TilemapData {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: TilemapLayer[];
  width: number;
  nextlayerid?: number;
  nextobjectid?: number;
  orientation?: string;
  renderorder?: string;
  tiledversion?: string;
  tileheight?: number;
  tilesets?: TilemapTileset[];
  tilewidth?: number;
  type?: string;
  version?: string;
}

export interface TiledMapConfig {
  tilesetImage: string;
  displayMapName: string;
  walkableLayers: string[];
  visibleLayers: string[];
  defaultPlayerPosition: Position;
  /** When true, shows debug overlays (controls, character position, status). Defaults to false. */
  debug?: boolean;
  /**
   * How many tiles tall the character's *visible body* renders, overriding the global
   * `CHARACTER_BODY_HEIGHT_TILES`. Maps whose art uses a different tile scale than the
   * 16px baseline (e.g. 32px tiles) must set this so the shared character sprite stays
   * a consistent pixel size across maps. It also sets the body's width, and with it the
   * collision footprint: `bodyWidthTiles = bodyHeightTiles * 32/48`.
   */
  characterBodyHeightTiles?: number;

  /**
   * How far below its collision point the sprite is drawn, in tiles, overriding the
   * global `CHARACTER_FOOT_OFFSET_TILES`. Render-only. Set it to 0 to pin a map to the
   * pre-offset look.
   */
  characterFootOffsetTiles?: number;
}
