import type { MarkerStatus } from '~/lib/map-draw';
import type { MapPoint, MapSize } from '~/lib/map-camera';
import type { MapDefinition } from '~/types/map';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import { MAP_NODE_MARKER_STYLES } from '~/constants/map';
import {
  MINIMAP_CHROME_HEIGHT_PX,
  MINIMAP_CHROME_WIDTH_PX,
  MINIMAP_DOCK_WIDTH_FRACTION,
  MINIMAP_MAX_PX_PER_TILE,
  MINIMAP_MIN_PX_PER_TILE,
} from '~/constants/minimap';

/** Which side of the window the sheet docks to. */
export type MinimapDockSide = 'left' | 'right';

export interface MinimapLayout {
  /** Where the sheet sits. `center` is the fallback when docking would make it too small. */
  side: MinimapDockSide | 'center';
  /** Size of the chart, in CSS pixels. */
  sheet: MapSize;
}

/**
 * The side to dock the sheet on so it stays clear of the character. She's on the
 * opposite half of the map, which is also where the camera shows her once it's clamped
 * at a map edge; when it isn't clamped she's mid-screen and either side is clear.
 *
 * @param characterPoint Where the character stands, in map pixels.
 * @param cols Map width in tiles.
 * @param tileSize Edge length of one tile in map pixels.
 */
export function getMinimapDockSide(characterPoint: MapPoint, cols: number, tileSize: number): MinimapDockSide {
  return characterPoint.x < (cols * tileSize) / 2 ? 'right' : 'left';
}

/**
 * The largest chart that fits the given box at the map's aspect ratio, or `null` when
 * it would drop below the minimum pixels per tile.
 */
function fitMinimapSheet(available: MapSize, cols: number, rows: number): MapSize | null {
  if (cols <= 0 || rows <= 0) return null;
  const pxPerTile = Math.min(available.width / cols, available.height / rows);
  if (pxPerTile < MINIMAP_MIN_PX_PER_TILE) return null;
  const clamped = Math.min(MINIMAP_MAX_PX_PER_TILE, pxPerTile);
  return { width: Math.round(cols * clamped), height: Math.round(rows * clamped) };
}

/**
 * Sizes and places the sheet. Docked, it may use a fraction of the window width; when
 * even the minimum scale doesn't fit there it goes centre-stage with the full width, and
 * failing that it's drawn at the minimum scale regardless.
 *
 * @param window Window size in CSS pixels.
 * @param cols Map width in tiles.
 * @param rows Map height in tiles.
 * @param dockSide Preferred side, from {@link getMinimapDockSide}.
 */
export function getMinimapLayout(
  window: MapSize,
  cols: number,
  rows: number,
  dockSide: MinimapDockSide,
): MinimapLayout {
  const height = window.height - MINIMAP_CHROME_HEIGHT_PX;

  const docked = fitMinimapSheet(
    { width: window.width * MINIMAP_DOCK_WIDTH_FRACTION - MINIMAP_CHROME_WIDTH_PX, height },
    cols,
    rows,
  );
  if (docked) return { side: dockSide, sheet: docked };

  const centred = fitMinimapSheet({ width: window.width - MINIMAP_CHROME_WIDTH_PX, height }, cols, rows);
  return {
    side: 'center',
    sheet: centred ?? { width: cols * MINIMAP_MIN_PX_PER_TILE, height: rows * MINIMAP_MIN_PX_PER_TILE },
  };
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
