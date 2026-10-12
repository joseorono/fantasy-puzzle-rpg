import type { TilemapData, TilemapLayer, TilemapTileset } from '~/types/tilemap';
import type { MapDefinition, NodeMarkerState } from '~/types/map';
import type { InteractiveMapNode } from '~/types/map-node';
import type { GridPosition, PixelRect, Position } from '~/types/geometry';
import type { OcclusionGrid } from '~/types/map-occlusion';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { MapPoint, ViewportLayout } from '~/lib/map-camera';
import {
  MAP_BACKGROUND_COLOR,
  MAP_MARKER_BOB_PX,
  MAP_MARKER_CHECK,
  MAP_MARKER_CULL_MARGIN_PX,
  MAP_MARKER_FLOAT_LIFT_PX,
  MAP_MARKER_PLATE_SIZE_PX,
  MAP_MARKER_PULSE_RADIANS_PER_SECOND,
  MAP_MARKER_SHADOW,
} from '~/constants/map';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';
import { getMarkerAtlasExtraFrame, getMarkerAtlasFrame } from '~/lib/map-marker-atlas';

/** A marker's reach, bob and badge included, in map pixels. Used to skip markers outside the view. */
export interface MarkerBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface MarkerBase {
  /** Top-left of the plate (nodes) or the floating symbol (loot, triggers), in map pixels, at rest. */
  x: number;
  y: number;
  /** Whole-number art scale, from {@link getMapMarkerScale}. */
  scale: number;
  bounds: MarkerBounds;
}

export interface NodeMarker extends MarkerBase {
  kind: 'node';
  nodeType: MapNodeType;
  state: NodeMarkerState;
}

export interface FloorLootMarker extends MarkerBase {
  kind: 'floorLoot';
}

/** Only unvisited triggers get one. */
export interface DialogueTriggerMarker extends MarkerBase {
  kind: 'dialogueTrigger';
}

export type MapMarker = NodeMarker | FloorLootMarker | DialogueTriggerMarker;

/** Progress lookups the marker list needs. */
export interface MarkerStatus {
  isNodeCompleted: (node: InteractiveMapNode) => boolean;
  isFloorLootCollected: (lootId: string) => boolean;
  isTriggerVisited: (row: number, col: number) => boolean;
}

/**
 * The whole-number scale markers draw at, so a 16px symbol keeps its size relative to
 * the tile without ever being resampled to a fraction.
 *
 * @param tileSize Edge length of one tile in map pixels.
 */
export function getMapMarkerScale(tileSize: number): number {
  return Math.max(1, Math.round(tileSize / JIRBY_SYMBOL_SHEET.cellSize));
}

/**
 * How a node marker draws: coloured until done, grey with a check once done, and lit
 * in colour again (check kept) while the character stands on it.
 *
 * @param isDone Whether the node is completed.
 * @param isOccupied Whether the character stands on the node's tile.
 */
export function getNodeMarkerState(isDone: boolean, isOccupied: boolean): NodeMarkerState {
  if (!isDone) return 'todo';
  return isOccupied ? 'doneActive' : 'done';
}

/** A tile's rect grown by the cull margin. */
function getTileBounds(row: number, col: number, tileSize: number, scale: number): MarkerBounds {
  const margin = MAP_MARKER_CULL_MARGIN_PX * scale;
  return {
    left: col * tileSize - margin,
    top: row * tileSize - margin,
    right: (col + 1) * tileSize + margin,
    bottom: (row + 1) * tileSize + margin,
  };
}

/** Top-left of a floating symbol: centred on its tile, hovering above the tile's bottom edge. */
function getFloatingOrigin(row: number, col: number, tileSize: number, scale: number): MapPoint {
  const symbolSize = JIRBY_SYMBOL_SHEET.cellSize * scale;
  return {
    x: col * tileSize + (tileSize - symbolSize) / 2,
    y: (row + 1) * tileSize - symbolSize - MAP_MARKER_FLOAT_LIFT_PX * scale,
  };
}

/**
 * Everything the map draws on top of its tiles, resolved against current progress.
 * Collected floor loot and visited dialogue triggers are left out entirely.
 *
 * @param map The map whose nodes, floor loot and dialogue triggers to list.
 * @param tileSize Edge length of one tile in map pixels.
 * @param status Progress lookups.
 * @param characterTile The tile the character stands on; a completed node there relights.
 */
export function buildMarkerList(
  map: MapDefinition,
  tileSize: number,
  status: MarkerStatus,
  characterTile: GridPosition | null = null,
): MapMarker[] {
  const markers: MapMarker[] = [];
  const scale = getMapMarkerScale(tileSize);
  const plateSize = MAP_MARKER_PLATE_SIZE_PX * scale;

  for (const node of map.nodes ?? []) {
    const { row, col } = node.position;
    const isOccupied = characterTile !== null && characterTile.row === row && characterTile.col === col;
    // The plate is wider than the tile: centred on it, standing on its bottom edge.
    markers.push({
      kind: 'node',
      x: col * tileSize + (tileSize - plateSize) / 2,
      y: (row + 1) * tileSize - plateSize,
      scale,
      bounds: getTileBounds(row, col, tileSize, scale),
      nodeType: node.type,
      state: getNodeMarkerState(status.isNodeCompleted(node), isOccupied),
    });
  }

  for (const spot of map.floorLoot ?? []) {
    if (status.isFloorLootCollected(spot.id)) continue;
    const { row, col } = spot.position;
    markers.push({
      kind: 'floorLoot',
      ...getFloatingOrigin(row, col, tileSize, scale),
      scale,
      bounds: getTileBounds(row, col, tileSize, scale),
    });
  }

  for (const trigger of map.dialogueTriggers ?? []) {
    if (trigger.autoPlay || status.isTriggerVisited(trigger.row, trigger.col)) continue;
    markers.push({
      kind: 'dialogueTrigger',
      ...getFloatingOrigin(trigger.row, trigger.col, tileSize, scale),
      scale,
      bounds: getTileBounds(trigger.row, trigger.col, tileSize, scale),
    });
  }

  return markers;
}

/**
 * Whether any part of a marker, bob and badge included, can show in the view.
 *
 * @param marker The marker.
 * @param camera Rounded camera, in map pixels.
 * @param layout The viewport's visible size.
 */
export function isMarkerInView(
  marker: MapMarker,
  camera: MapPoint,
  layout: Pick<ViewportLayout, 'viewWidth' | 'viewHeight'>,
): boolean {
  const { bounds } = marker;
  return (
    bounds.right > camera.x &&
    bounds.left < camera.x + layout.viewWidth &&
    bounds.bottom > camera.y &&
    bounds.top < camera.y + layout.viewHeight
  );
}

/**
 * The markers' shared bob angle at a moment in time.
 *
 * @param timestampMs A `requestAnimationFrame` / `performance.now()` timestamp.
 * @returns An angle in `[0, 2π)`.
 */
export function getMarkerPulsePhase(timestampMs: number): number {
  return ((timestampMs / 1000) * MAP_MARKER_PULSE_RADIANS_PER_SECOND) % (Math.PI * 2);
}

/**
 * The markers' bob at a phase, rounded so the art always lands on whole marker pixels.
 *
 * @param phase From {@link getMarkerPulsePhase}.
 * @returns A vertical offset in marker pixels, between `-MAP_MARKER_BOB_PX` and `MAP_MARKER_BOB_PX`.
 */
export function getMarkerBobOffset(phase: number): number {
  return Math.round(Math.sin(phase) * MAP_MARKER_BOB_PX);
}

/** Tiled packs a tile's flip flags into the top bits of its GID ("Global tile IDs" in the Tiled docs). */
const TILED_FLIP_H = 0x80000000;
const TILED_FLIP_V = 0x40000000;
const TILED_FLIP_D = 0x20000000;
/** Clears all four flag bits, including the hex-rotate bit Tiled keeps even on orthogonal maps. */
const TILED_GID_MASK = 0x0fffffff;

export interface TileFlips {
  flipH: boolean;
  flipV: boolean;
  flipD: boolean;
}

export interface DecodedTileGid extends TileFlips {
  /** The tile's global id with every flag bit cleared. */
  gid: number;
}

/**
 * Splits a Tiled GID into its tile id and flip flags.
 *
 * @param rawGid A value from a tile layer's `data`, flags included.
 */
export function decodeTileGid(rawGid: number): DecodedTileGid {
  return {
    gid: rawGid & TILED_GID_MASK,
    flipH: (rawGid & TILED_FLIP_H) !== 0,
    flipV: (rawGid & TILED_FLIP_V) !== 0,
    flipD: (rawGid & TILED_FLIP_D) !== 0,
  };
}

/**
 * The 2×2 transform that applies a tile's flips about its centre, as the `[a, b, c, d]`
 * of `CanvasRenderingContext2D.setTransform`. Tiled applies the diagonal flip first, then
 * the horizontal and vertical ones.
 *
 * @param flips From {@link decodeTileGid}.
 */
export function getTileFlipMatrix(flips: TileFlips): [number, number, number, number] {
  const scaleX = flips.flipH ? -1 : 1;
  const scaleY = flips.flipV ? -1 : 1;
  // The diagonal flip swaps the axes, so the scales move to the off-diagonal.
  return flips.flipD ? [0, scaleY, scaleX, 0] : [scaleX, 0, 0, scaleY];
}

/**
 * Draws one tile layer, in map pixels. Expects and leaves the context at the identity transform.
 * `shouldDrawCell`, when given, limits the layer to the cells it accepts.
 */
function drawTileLayer(
  ctx: CanvasRenderingContext2D,
  layer: TilemapLayer,
  tileset: HTMLImageElement,
  tilesetInfo: TilemapTileset,
  tileSize: number,
  shouldDrawCell?: (col: number, row: number) => boolean,
): void {
  const { columns, tilewidth, tileheight, firstgid, margin, spacing } = tilesetInfo;
  const half = tileSize / 2;

  ctx.globalAlpha = layer.opacity;
  for (let y = 0; y < layer.height; y++) {
    for (let x = 0; x < layer.width; x++) {
      const rawGid = layer.data[y * layer.width + x];
      // 0 means no tile.
      if (rawGid === 0) continue;
      if (shouldDrawCell && !shouldDrawCell(x, y)) continue;

      const { gid, flipH, flipV, flipD } = decodeTileGid(rawGid);
      const tileIndex = gid - firstgid;
      const sourceX = margin + (tileIndex % columns) * (tilewidth + spacing);
      const sourceY = margin + Math.floor(tileIndex / columns) * (tileheight + spacing);
      const destX = x * tileSize;
      const destY = y * tileSize;

      if (!flipH && !flipV && !flipD) {
        ctx.drawImage(tileset, sourceX, sourceY, tilewidth, tileheight, destX, destY, tileSize, tileSize);
        continue;
      }

      const [a, b, c, d] = getTileFlipMatrix({ flipH, flipV, flipD });
      ctx.setTransform(a, b, c, d, destX + half, destY + half);
      ctx.drawImage(tileset, sourceX, sourceY, tilewidth, tileheight, -half, -half, tileSize, tileSize);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Pre-renders a map's static tile layers into an offscreen canvas at full map size, so
 * each frame only copies the visible slice instead of redrawing every tile.
 *
 * @param mapData The Tiled map.
 * @param tileset The loaded tileset image.
 * @param layerNames Layers to draw, matched by name; drawn in the map's own layer order.
 * @param tileSize Edge length of one tile in map pixels.
 * @returns The cache canvas, or `null` when the map has no tileset or a 2D context is unavailable.
 */
export function buildStaticLayerCanvas(
  mapData: TilemapData,
  tileset: HTMLImageElement,
  layerNames: string[],
  tileSize: number,
): HTMLCanvasElement | null {
  const tilesetInfo = mapData.tilesets?.[0];
  if (!tilesetInfo) return null;

  const canvas = document.createElement('canvas');
  canvas.width = mapData.width * tileSize;
  canvas.height = mapData.height * tileSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  for (const layer of mapData.layers) {
    if (!layerNames.includes(layer.name)) continue;
    drawTileLayer(ctx, layer, tileset, tilesetInfo, tileSize);
  }

  return canvas;
}

/**
 * Pre-renders only what can cover the character: at each occluding cell, every visible
 * layer from the cell's lowest occluder upward, so decorations stacked on a bush or a
 * canopy keep their order when redrawn over her.
 *
 * @param mapData The Tiled map.
 * @param tileset The loaded tileset image.
 * @param layerNames Visible layers, matched by name.
 * @param grid From `buildOcclusionGrid`.
 * @param tileSize Edge length of one tile in map pixels.
 * @returns The occluder cache, or `null` when nothing occludes or a 2D context is unavailable.
 */
export function buildOccluderLayerCanvas(
  mapData: TilemapData,
  tileset: HTMLImageElement,
  layerNames: string[],
  grid: OcclusionGrid,
  tileSize: number,
): HTMLCanvasElement | null {
  const tilesetInfo = mapData.tilesets?.[0];
  if (!tilesetInfo || grid.occludingCellCount === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = mapData.width * tileSize;
  canvas.height = mapData.height * tileSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  mapData.layers.forEach((layer, layerIndex) => {
    if (!layerNames.includes(layer.name)) return;
    drawTileLayer(ctx, layer, tileset, tilesetInfo, tileSize, (col, row) => {
      const startLayer = grid.startLayers[row * grid.width + col];
      return startLayer !== -1 && layerIndex >= startLayer;
    });
  });

  return canvas;
}

/**
 * Redraws the given occluder cells over the character, in map pixels under the camera
 * transform. Outside her outline the result matches the map canvas beneath, so the
 * cells can be drawn whole.
 *
 * @param ctx The occlusion canvas's context, cleared by the caller.
 * @param cache From {@link buildOccluderLayerCanvas}.
 * @param cells Cell indices from `collectOccludingCells`; only the first `count` are read.
 * @param count How many entries of `cells` to draw.
 * @param mapWidth Map width in tiles.
 * @param tileSize Edge length of one tile in map pixels.
 * @param camera Rounded camera, in map pixels.
 * @param layout The viewport layout.
 * @param alpha Opacity of the redrawn cells.
 */
export function drawOcclusionPatch(
  ctx: CanvasRenderingContext2D,
  cache: HTMLCanvasElement,
  cells: readonly number[],
  count: number,
  mapWidth: number,
  tileSize: number,
  camera: MapPoint,
  layout: ViewportLayout,
  alpha: number,
): void {
  const { zoom } = layout;
  ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;

  for (let i = 0; i < count; i++) {
    const cell = cells[i];
    const x = (cell % mapWidth) * tileSize;
    const y = Math.floor(cell / mapWidth) * tileSize;
    ctx.drawImage(cache, x, y, tileSize, tileSize, x, y, tileSize, tileSize);
  }

  ctx.globalAlpha = 1;
}

/**
 * Draws a see-through copy of the character's current frame over the occlusion patch,
 * kept to the patch's own pixels (`source-atop`), so she shows through exactly where
 * foliage covers her and nowhere else.
 *
 * @param ctx The occlusion canvas's context, with the patch already drawn.
 * @param sheet The character's loaded sprite sheet.
 * @param frameOrigin Top-left of the current frame in the sheet, from `getSpriteFrameOrigin`.
 * @param frameSize Edge length of one sheet frame.
 * @param rect Where the DOM sprite draws the frame, from `getCharacterFrameViewportRect`.
 * @param alpha Opacity of the copy.
 */
export function drawOccludedCharacterGhost(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  frameOrigin: Position,
  frameSize: number,
  rect: PixelRect,
  alpha: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = alpha;
  ctx.drawImage(sheet, frameOrigin.x, frameOrigin.y, frameSize, frameSize, rect.x, rect.y, rect.width, rect.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Copies the visible slice of the layer cache into the viewport canvas at `zoom`.
 *
 * The camera is whole map pixels and the zoom an integer, so the copy is an exact
 * nearest-neighbour upscale. The slice always covers the whole canvas, so no clear is
 * needed. Smoothing is set every call because resizing a canvas resets its context.
 *
 * @param ctx The viewport canvas's context.
 * @param cache From {@link buildStaticLayerCanvas}; `null` fills with the background colour.
 * @param camera Rounded camera, in map pixels.
 * @param layout The viewport layout.
 */
export function drawCameraView(
  ctx: CanvasRenderingContext2D,
  cache: HTMLCanvasElement | null,
  camera: MapPoint,
  layout: ViewportLayout,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  if (!cache) {
    ctx.fillStyle = MAP_BACKGROUND_COLOR;
    ctx.fillRect(0, 0, layout.cssWidth, layout.cssHeight);
    return;
  }

  ctx.drawImage(
    cache,
    camera.x,
    camera.y,
    layout.viewWidth,
    layout.viewHeight,
    0,
    0,
    layout.cssWidth,
    layout.cssHeight,
  );
}

/** Copies one atlas sprite to the map at a whole-number scale. */
function drawAtlasSprite(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  frame: PixelRect,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.drawImage(atlas, frame.x, frame.y, frame.width, frame.height, x, y, frame.width * scale, frame.height * scale);
}

function drawNodeMarker(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  marker: NodeMarker,
  bob: number,
): void {
  const { x, y, scale, state } = marker;

  // The shadow stays on the ground while the plate bobs; it tucks under the plate's bottom edge.
  const shadow = getMarkerAtlasExtraFrame('plateShadow');
  const shadowX = x + ((MAP_MARKER_PLATE_SIZE_PX - shadow.width) / 2) * scale;
  const shadowY = y + (MAP_MARKER_PLATE_SIZE_PX - MAP_MARKER_SHADOW.overlapPx) * scale;
  drawAtlasSprite(ctx, atlas, shadow, shadowX, shadowY, scale);

  // Only nodes still to do bob; the frame starts above the plate to hold the check badge.
  const lift = state === 'todo' ? bob : 0;
  const frame = getMarkerAtlasFrame(marker.nodeType, state);
  drawAtlasSprite(ctx, atlas, frame, x, y + (lift - MAP_MARKER_CHECK.overhangPx) * scale, scale);
}

function drawFloatingMarker(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  marker: FloorLootMarker | DialogueTriggerMarker,
  bob: number,
): void {
  const { x, y, scale } = marker;
  const symbolSize = JIRBY_SYMBOL_SHEET.cellSize;

  const shadow = getMarkerAtlasExtraFrame('floatShadow');
  drawAtlasSprite(ctx, atlas, shadow, x + ((symbolSize - shadow.width) / 2) * scale, y + symbolSize * scale, scale);
  drawAtlasSprite(ctx, atlas, getMarkerAtlasExtraFrame(marker.kind), x, y + bob * scale, scale);
}

/**
 * Draws the markers that can show in the view, in map pixels under a camera transform.
 *
 * @param ctx The viewport canvas's context.
 * @param markers From {@link buildMarkerList}.
 * @param camera Rounded camera, in map pixels.
 * @param layout The viewport layout.
 * @param phase From {@link getMarkerPulsePhase}.
 * @param atlas From `getReadyMapMarkerAtlas`; `null` while the symbol sheet loads, which draws nothing.
 */
export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MapMarker[],
  camera: MapPoint,
  layout: ViewportLayout,
  phase: number,
  atlas: HTMLCanvasElement | null,
): void {
  if (!atlas) return;

  const { zoom } = layout;
  ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
  ctx.imageSmoothingEnabled = false;
  const bob = getMarkerBobOffset(phase);

  for (const marker of markers) {
    if (!isMarkerInView(marker, camera, layout)) continue;

    if (marker.kind === 'node') {
      drawNodeMarker(ctx, atlas, marker, bob);
    } else {
      drawFloatingMarker(ctx, atlas, marker, bob);
    }
  }
}
