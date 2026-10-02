import { isMaskWalkable, type WalkableMask } from '~/lib/tilemap-collision';
import type { MarkerStatus } from '~/lib/map-draw';
import type { MapPoint, MapSize } from '~/lib/map-camera';
import type { MapDefinition } from '~/types/map';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import { MAP_NODE_MARKER_STYLES } from '~/constants/map';
import {
  MINIMAP_AGED_EDGE_RGB,
  MINIMAP_AGED_EDGE_TILES,
  MINIMAP_EDGE_RGB,
  MINIMAP_GRAIN,
  MINIMAP_PARCHMENT_RGB,
  MINIMAP_PATH_RGB,
  type MinimapRgb,
} from '~/constants/minimap';

/** How a tile is drawn on the overview. */
export type MinimapTileKind = 'path' | 'edge' | 'blank';

export interface MinimapPalette {
  parchment: MinimapRgb;
  path: MinimapRgb;
  edge: MinimapRgb;
  agedEdge: MinimapRgb;
  /** Width of the aged border, in tiles. 0 turns ageing off. */
  agedEdgeTiles: number;
  /** Largest brightness jitter on blank parchment. 0 turns grain off. */
  grain: number;
}

export const DEFAULT_MINIMAP_PALETTE: MinimapPalette = {
  parchment: MINIMAP_PARCHMENT_RGB,
  path: MINIMAP_PATH_RGB,
  edge: MINIMAP_EDGE_RGB,
  agedEdge: MINIMAP_AGED_EDGE_RGB,
  agedEdgeTiles: MINIMAP_AGED_EDGE_TILES,
  grain: MINIMAP_GRAIN,
};

/** The eight neighbours of a tile, as `[rowOffset, colOffset]`. */
const NEIGHBOUR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/**
 * Classifies a tile for the overview: walkable ground is a path, blocked ground
 * touching a path (diagonals included) is its ink outline, everything else is blank.
 *
 * @param mask The map's walkable mask. Out-of-bounds tiles count as blocked.
 * @param row Grid row.
 * @param col Grid column.
 */
export function classifyMinimapTile(mask: WalkableMask, row: number, col: number): MinimapTileKind {
  if (isMaskWalkable(mask, row, col)) return 'path';
  for (const [rowOffset, colOffset] of NEIGHBOUR_OFFSETS) {
    if (isMaskWalkable(mask, row + rowOffset, col + colOffset)) return 'edge';
  }
  return 'blank';
}

/**
 * Deterministic per-tile noise, so a map's paper grain is identical every time it opens.
 *
 * @param row Grid row.
 * @param col Grid column.
 * @returns A value in `[-1, 1]`.
 */
export function tileGrain(row: number, col: number): number {
  let hash = Math.imul(row, 374761393) ^ Math.imul(col, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash ^= hash >>> 16;
  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

/**
 * How strongly a tile is aged by its closeness to the map border.
 *
 * @param row Grid row.
 * @param col Grid column.
 * @param rows Map height in tiles.
 * @param cols Map width in tiles.
 * @param edgeTiles Width of the aged border.
 * @returns 1 on the border, falling linearly to 0 at `edgeTiles` in.
 */
export function agedEdgeFactor(row: number, col: number, rows: number, cols: number, edgeTiles: number): number {
  if (edgeTiles <= 0) return 0;
  const distance = Math.min(row, col, rows - 1 - row, cols - 1 - col);
  return Math.min(1, Math.max(0, 1 - distance / edgeTiles));
}

/** Writes one opaque RGB pixel. */
function writePixel(pixels: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  pixels[offset] = red;
  pixels[offset + 1] = green;
  pixels[offset + 2] = blue;
  pixels[offset + 3] = 255;
}

/**
 * Renders the overview image: one RGBA pixel per tile, row-major, ready for `ImageData`.
 *
 * Paths and outlines are flat ink. Blank parchment blends toward the aged-edge colour
 * near the border and gets a little deterministic grain.
 *
 * @param mask The map's walkable mask.
 * @param palette Colours and texture amounts.
 */
export function buildMinimapPixels(mask: WalkableMask, palette: MinimapPalette = DEFAULT_MINIMAP_PALETTE) {
  const { width: cols, height: rows } = mask;
  const pixels = new Uint8ClampedArray(cols * rows * 4);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offset = (row * cols + col) * 4;
      const kind = classifyMinimapTile(mask, row, col);

      if (kind !== 'blank') {
        const [red, green, blue] = kind === 'path' ? palette.path : palette.edge;
        writePixel(pixels, offset, red, green, blue);
        continue;
      }

      const aged = agedEdgeFactor(row, col, rows, cols, palette.agedEdgeTiles);
      const grain = Math.round(tileGrain(row, col) * palette.grain);
      const [red, green, blue] = palette.parchment.map(
        (channel, index) => Math.round(channel + (palette.agedEdge[index] - channel) * aged) + grain,
      );
      writePixel(pixels, offset, red, green, blue);
    }
  }

  return pixels;
}

/**
 * The integer screen scale (pixels per tile) at which the whole map fits.
 *
 * @param available Space for the image, in CSS pixels.
 * @param cols Map width in tiles.
 * @param rows Map height in tiles.
 * @param minScale Floor, used even when the map then doesn't fit.
 * @param maxScale Ceiling, so small maps stay a sensible size.
 */
export function getMinimapScale(
  available: MapSize,
  cols: number,
  rows: number,
  minScale: number,
  maxScale: number,
): number {
  if (cols <= 0 || rows <= 0) return minScale;
  const fitting = Math.floor(Math.min(available.width / cols, available.height / rows));
  return Math.min(maxScale, Math.max(minScale, fitting));
}

/**
 * Converts a map-pixel point to a position on the overview, as percentages of its size,
 * for absolutely positioned overlays.
 *
 * @param point Point in map pixels.
 * @param cols Map width in tiles.
 * @param rows Map height in tiles.
 * @param tileSize Edge length of one tile in map pixels.
 */
export function mapPointToMinimapPercent(
  point: MapPoint,
  cols: number,
  rows: number,
  tileSize: number,
): { left: number; top: number } {
  return {
    left: (point.x / (cols * tileSize)) * 100,
    top: (point.y / (rows * tileSize)) * 100,
  };
}

/**
 * Converts a tile to the percentage position of its centre on the overview.
 *
 * @param row Grid row.
 * @param col Grid column.
 * @param cols Map width in tiles.
 * @param rows Map height in tiles.
 */
export function tileToMinimapPercent(
  row: number,
  col: number,
  cols: number,
  rows: number,
): { left: number; top: number } {
  return mapPointToMinimapPercent({ x: col + 0.5, y: row + 0.5 }, cols, rows, 1);
}

/** Something pinned on the overview. */
export interface MinimapMarker {
  kind: 'node' | 'floorLoot' | 'dialogueTrigger';
  /** Stable React key. */
  id: string;
  row: number;
  col: number;
  isDone: boolean;
  /** Node markers only. */
  nodeType?: MapNodeType;
  /** Node markers only: the same glyph the map draws. */
  icon?: string;
}

/**
 * Lists what the overview pins. Completed nodes stay (dimmed, so the player sees what's
 * cleared); collected loot and visited dialogue triggers are left out.
 *
 * @param map The map.
 * @param status Progress lookups — the same ones the map's own markers use.
 */
export function buildMinimapMarkers(map: MapDefinition, status: MarkerStatus): MinimapMarker[] {
  const markers: MinimapMarker[] = [];

  for (const node of map.nodes ?? []) {
    const isDone = status.isNodeCompleted(node);
    const style = MAP_NODE_MARKER_STYLES[node.type];
    markers.push({
      kind: 'node',
      id: `node-${node.id}`,
      row: node.position.row,
      col: node.position.col,
      isDone,
      nodeType: node.type,
      icon: isDone ? (style.doneIcon ?? style.icon) : style.icon,
    });
  }

  for (const spot of map.floorLoot ?? []) {
    if (status.isFloorLootCollected(spot.id)) continue;
    markers.push({
      kind: 'floorLoot',
      id: `loot-${spot.id}`,
      row: spot.position.row,
      col: spot.position.col,
      isDone: false,
    });
  }

  for (const trigger of map.dialogueTriggers ?? []) {
    if (status.isTriggerVisited(trigger.row, trigger.col)) continue;
    markers.push({
      kind: 'dialogueTrigger',
      id: `trigger-${trigger.row}-${trigger.col}`,
      row: trigger.row,
      col: trigger.col,
      isDone: false,
    });
  }

  return markers;
}

/** Order the legend lists node types in, regardless of their order on the map. */
const LEGEND_ORDER: readonly MapNodeType[] = ['Town', 'Dungeon', 'Battle', 'Boss', 'Treasure', 'Mystery'];

/**
 * The node types present on the overview, in a fixed order, with their glyphs.
 * Types the map doesn't have get no legend entry.
 *
 * @param markers From {@link buildMinimapMarkers}.
 */
export function getMinimapLegend(markers: MinimapMarker[]): { type: MapNodeType; icon: string }[] {
  const present = new Set(markers.map((marker) => marker.nodeType));
  return LEGEND_ORDER.filter((type) => present.has(type)).map((type) => ({
    type,
    icon: MAP_NODE_MARKER_STYLES[type].icon,
  }));
}
