import type { TilemapData, TilemapLayer, TilemapTileset } from '~/types/tilemap';
import type { MapDefinition } from '~/types/map';
import type { InteractiveMapNode } from '~/types/map-node';
import type { MapPoint, ViewportLayout } from '~/lib/map-camera';
import {
  MAP_BACKGROUND_COLOR,
  MAP_MARKER_CULL_MARGIN_PX,
  MAP_MARKER_PULSE_RADIANS_PER_SECOND,
  MAP_NODE_CHECK_INSET_RATIO,
  MAP_NODE_CHECK_RATIO,
  MAP_NODE_ICON_RATIO,
  MAP_NODE_MARKER_SIZE,
  MAP_NODE_MARKER_STYLES,
  type MapNodeMarkerStyle,
} from '~/constants/map';

/** A marker's reach, glow included, in map pixels. Used to skip markers outside the view. */
export interface MarkerBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface MarkerBase {
  /** Top-left of the marker square, in map pixels. */
  x: number;
  y: number;
  /** Edge length of the marker square, in map pixels. */
  size: number;
  bounds: MarkerBounds;
}

export interface NodeMarker extends MarkerBase {
  kind: 'node';
  isDone: boolean;
  style: MapNodeMarkerStyle;
}

/** `x`/`y`/`size` describe the loot's tile; the coin is drawn centred on it. */
export interface FloorLootMarker extends MarkerBase {
  kind: 'floorLoot';
}

export interface DialogueTriggerMarker extends MarkerBase {
  kind: 'dialogueTrigger';
  isDone: boolean;
}

export type MapMarker = NodeMarker | FloorLootMarker | DialogueTriggerMarker;

/** Progress lookups the marker list needs. */
export interface MarkerStatus {
  isNodeCompleted: (node: InteractiveMapNode) => boolean;
  isFloorLootCollected: (lootId: string) => boolean;
  isTriggerVisited: (row: number, col: number) => boolean;
}

/** A tile's rect grown by the cull margin. */
function getTileBounds(row: number, col: number, tileSize: number): MarkerBounds {
  return {
    left: col * tileSize - MAP_MARKER_CULL_MARGIN_PX,
    top: row * tileSize - MAP_MARKER_CULL_MARGIN_PX,
    right: (col + 1) * tileSize + MAP_MARKER_CULL_MARGIN_PX,
    bottom: (row + 1) * tileSize + MAP_MARKER_CULL_MARGIN_PX,
  };
}

/**
 * Everything the map draws on top of its tiles, resolved against current progress.
 * Collected floor loot is left out entirely.
 *
 * @param map The map whose nodes, floor loot and dialogue triggers to list.
 * @param tileSize Edge length of one tile in map pixels.
 * @param status Progress lookups.
 */
export function buildMarkerList(map: MapDefinition, tileSize: number, status: MarkerStatus): MapMarker[] {
  const markers: MapMarker[] = [];

  for (const node of map.nodes ?? []) {
    const { row, col } = node.position;
    // Markers are bigger than a tile, so centre them on the node's tile.
    const inset = (MAP_NODE_MARKER_SIZE - tileSize) / 2;
    markers.push({
      kind: 'node',
      x: col * tileSize - inset,
      y: row * tileSize - inset,
      size: MAP_NODE_MARKER_SIZE,
      bounds: getTileBounds(row, col, tileSize),
      isDone: status.isNodeCompleted(node),
      style: MAP_NODE_MARKER_STYLES[node.type],
    });
  }

  for (const spot of map.floorLoot ?? []) {
    if (status.isFloorLootCollected(spot.id)) continue;
    const { row, col } = spot.position;
    markers.push({
      kind: 'floorLoot',
      x: col * tileSize,
      y: row * tileSize,
      size: tileSize,
      bounds: getTileBounds(row, col, tileSize),
    });
  }

  for (const trigger of map.dialogueTriggers ?? []) {
    markers.push({
      kind: 'dialogueTrigger',
      x: trigger.col * tileSize,
      y: trigger.row * tileSize,
      size: tileSize,
      bounds: getTileBounds(trigger.row, trigger.col, tileSize),
      isDone: status.isTriggerVisited(trigger.row, trigger.col),
    });
  }

  return markers;
}

/**
 * Whether any part of a marker, glow included, can show in the view.
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
 * The markers' shared pulse angle at a moment in time.
 *
 * @param timestampMs A `requestAnimationFrame` / `performance.now()` timestamp.
 * @returns An angle in `[0, 2π)`.
 */
export function getMarkerPulsePhase(timestampMs: number): number {
  return ((timestampMs / 1000) * MAP_MARKER_PULSE_RADIANS_PER_SECOND) % (Math.PI * 2);
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

/** Draws one tile layer, in map pixels. Expects and leaves the context at the identity transform. */
function drawTileLayer(
  ctx: CanvasRenderingContext2D,
  layer: TilemapLayer,
  tileset: HTMLImageElement,
  tilesetInfo: TilemapTileset,
  tileSize: number,
): void {
  const { columns, tilewidth, tileheight, firstgid, margin, spacing } = tilesetInfo;
  const half = tileSize / 2;

  ctx.globalAlpha = layer.opacity;
  for (let y = 0; y < layer.height; y++) {
    for (let x = 0; x < layer.width; x++) {
      const rawGid = layer.data[y * layer.width + x];
      // 0 means no tile.
      if (rawGid === 0) continue;

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

function drawNodeMarker(ctx: CanvasRenderingContext2D, marker: NodeMarker, phase: number): void {
  const { x: markerX, y: markerY, size: markerSize, isDone: isCompleted, style } = marker;
  const color = isCompleted ? style.doneColor : style.color;
  const icon = isCompleted ? (style.doneIcon ?? style.icon) : style.icon;

  // Pulse between 0.5 and 1.0
  const pulse = 0.5 + Math.sin(phase) * 0.5;

  if (!isCompleted) {
    // Pulsing glow for incomplete nodes
    const glowSize = markerSize * (1 + pulse * 0.3);
    const gradient = ctx.createRadialGradient(
      markerX + markerSize / 2,
      markerY + markerSize / 2,
      0,
      markerX + markerSize / 2,
      markerY + markerSize / 2,
      glowSize,
    );
    gradient.addColorStop(0, color + `${0.6 * pulse})`);
    gradient.addColorStop(0.5, color + `${0.3 * pulse})`);
    gradient.addColorStop(1, color + '0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(markerX - glowSize / 2, markerY - glowSize / 2, glowSize * 2, glowSize * 2);
  }

  // Marker background square
  ctx.fillStyle = color + (isCompleted ? '0.4)' : '0.7)');
  ctx.fillRect(markerX, markerY, markerSize, markerSize);

  // Icon
  ctx.font = `bold ${markerSize * MAP_NODE_ICON_RATIO}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, markerX + markerSize / 2, markerY + markerSize / 2);

  // Border
  ctx.strokeStyle = color + (isCompleted ? '0.6)' : `${0.8 + pulse * 0.2})`);
  ctx.lineWidth = isCompleted ? 1 : 2;
  ctx.strokeRect(markerX, markerY, markerSize, markerSize);

  // Completion checkmark
  if (isCompleted) {
    const checkInset = markerSize * MAP_NODE_CHECK_INSET_RATIO;
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = `bold ${markerSize * MAP_NODE_CHECK_RATIO}px monospace`;
    ctx.fillText('✓', markerX + markerSize - checkInset, markerY + checkInset);
  }
}

function drawFloorLootMarker(ctx: CanvasRenderingContext2D, marker: FloorLootMarker, phase: number): void {
  const tileSize = marker.size;
  const markerSize = tileSize * 0.6; // Smaller than node markers
  const centerX = marker.x + tileSize / 2;
  const centerY = marker.y + tileSize / 2;

  // Gentle pulse
  const pulse = 0.7 + Math.sin(phase * 1.5) * 0.3;

  // Subtle glow
  const glowSize = markerSize * 1.2;
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
  gradient.addColorStop(0.7, `rgba(255, 215, 0, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - glowSize, centerY - glowSize, glowSize * 2, glowSize * 2);

  // Coin icon
  ctx.fillStyle = `rgba(255, 215, 0, ${0.9 + pulse * 0.1})`;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💰', centerX, centerY);
}

function drawDialogueTriggerMarker(ctx: CanvasRenderingContext2D, marker: DialogueTriggerMarker, phase: number): void {
  const { x: markerX, y: markerY, size: markerSize } = marker;

  if (marker.isDone) {
    // Faded marker for visited triggers
    ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.fillRect(markerX, markerY, markerSize, markerSize);

    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(markerX, markerY, markerSize, markerSize);
    return;
  }

  // Pulse between 0.5 and 1.0
  const pulse = 0.5 + Math.sin(phase) * 0.5;

  // Outer glow
  const glowSize = markerSize * (1 + pulse * 0.5);
  const gradient = ctx.createRadialGradient(
    markerX + markerSize / 2,
    markerY + markerSize / 2,
    0,
    markerX + markerSize / 2,
    markerY + markerSize / 2,
    glowSize,
  );
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`);
  gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.3 * pulse})`);
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(markerX - glowSize / 2, markerY - glowSize / 2, glowSize * 2, glowSize * 2);

  // Exclamation marker
  ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', markerX + markerSize / 2, markerY + markerSize / 2);

  // Border
  ctx.strokeStyle = `rgba(255, 165, 0, ${0.6 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(markerX, markerY, markerSize, markerSize);
}

/**
 * Draws the markers that can show in the view, in map pixels under a camera transform.
 *
 * @param ctx The viewport canvas's context.
 * @param markers From {@link buildMarkerList}.
 * @param camera Rounded camera, in map pixels.
 * @param layout The viewport layout.
 * @param phase From {@link getMarkerPulsePhase}.
 */
export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: MapMarker[],
  camera: MapPoint,
  layout: ViewportLayout,
  phase: number,
): void {
  const { zoom } = layout;
  ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);

  for (const marker of markers) {
    if (!isMarkerInView(marker, camera, layout)) continue;

    switch (marker.kind) {
      case 'node':
        drawNodeMarker(ctx, marker, phase);
        break;
      case 'floorLoot':
        drawFloorLootMarker(ctx, marker, phase);
        break;
      case 'dialogueTrigger':
        drawDialogueTriggerMarker(ctx, marker, phase);
        break;
    }
  }
}
