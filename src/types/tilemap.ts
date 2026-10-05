// types/tilemap.ts
import type { Position } from './geometry';

export interface TilemapLayer {
  /** Tiled GIDs, row-major. The top bits carry flip flags; see `decodeTileGid` in `~/lib/map-draw`. */
  data: number[];
  height: number;
  id: number;
  name: string;
  /** Applied when the layer is drawn into the map's layer cache. */
  opacity: number;
  type: string;
  /** Editor-only. The map config's `visibleLayers` decides what renders. */
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
  /**
   * Base GIDs (flip bits ignored) whose tiles are fully transparent and draw
   * nothing. Skipped when finding the visible top tile for collision.
   */
  blankGids?: number[];
  /**
   * Base GIDs (flip bits ignored) of visible tiles that do not block movement —
   * overhead structures such as arches the player walks under. Skipped when
   * finding the visible top tile for collision.
   */
  overheadGids?: number[];
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
  /**
   * When set, walkability uses the visible-top-surface rule: a region cell is
   * walkable only when its top-most visibly drawn tile belongs to a walkable
   * layer or one of these layers. Lists extra non-walkable layers (floors)
   * acceptable as the visible top surface. An empty array means only walkable
   * layers may be the visible top.
   */
  surfaceLayers?: string[];
  defaultPlayerPosition: Position;
  /** When true, shows the position/status overlay — but only while `DEBUG_MODE` is on. Defaults to false. */
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

  /**
   * Integer display scale: each map pixel draws as `zoom`×`zoom` screen pixels. 1 shows the
   * map at its native pixel size. Non-integers are floored and values below 1 clamp to 1.
   * Omit for `MAP_DEFAULT_ZOOM`.
   */
  zoom?: number;
}
