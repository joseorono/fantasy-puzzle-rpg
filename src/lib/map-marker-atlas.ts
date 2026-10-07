import type { PixelRect } from '~/types/geometry';
import type { MarkerAtlasExtra, MarkerPlatePalette, NodeMarkerState, PlatePixelRole } from '~/types/map';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';
import {
  MAP_DIALOGUE_TRIGGER_SYMBOL,
  MAP_FLOOR_LOOT_SYMBOL,
  MAP_MARKER_CHECK,
  MAP_MARKER_DONE_PLATE,
  MAP_MARKER_OUTLINE_COLOR,
  MAP_MARKER_PLATE_SIZE_PX,
  MAP_MARKER_SHADOW,
  MAP_MARKER_SYMBOL_INSET_PX,
  MAP_NODE_MARKER_STATES,
  MAP_NODE_MARKER_STYLES,
} from '~/constants/map';
import { getJirbySymbolRect } from '~/lib/jirby-symbols';
import { getCachedImage, isImageReady } from '~/lib/image-cache';

/*
 * The marker atlas: every map marker sprite, painted once into one canvas so a frame
 * draws each marker with plain `drawImage` blits. Laid out at scale 1:
 *
 *   one row per node type, one column per state; each cell is the plate plus room
 *   for the check badge above and to the right of it
 *   a last row with the floating symbols and the two ground shadows
 */

/**
 * What a pixel of a square plate is painted as: clipped outer corners, a 1px outline
 * with filled inner corners, a highlight band along the top and a shade band along the
 * bottom.
 *
 * @param x Column inside the plate.
 * @param y Row inside the plate.
 * @param size Edge length of the plate.
 * @returns The role, or `null` for a transparent pixel.
 */
export function getPlatePixelRole(x: number, y: number, size: number): PlatePixelRole | null {
  const last = size - 1;
  const isEdgeX = x === 0 || x === last;
  const isEdgeY = y === 0 || y === last;
  if (isEdgeX && isEdgeY) return null;
  if (isEdgeX || isEdgeY) return 'outline';

  const isInnerEdgeX = x === 1 || x === last - 1;
  const isInnerEdgeY = y === 1 || y === last - 1;
  if (isInnerEdgeX && isInnerEdgeY) return 'outline';

  if (y === 1 || (y === 2 && isInnerEdgeX)) return 'highlight';
  if (y >= last - 2) return 'shade';
  return 'fill';
}

/**
 * Whether a pixel of a ground shadow is filled: a full middle row between two rows
 * inset by 2px, which reads as a flat ellipse at pixel scale.
 *
 * @param x Column inside the shadow.
 * @param y Row inside the shadow (0–2).
 * @param width Width of the shadow.
 */
export function isShadowPixel(x: number, y: number, width: number): boolean {
  if (x < 0 || x >= width || y < 0 || y >= MAP_MARKER_SHADOW.height) return false;
  return y === 1 || (x >= 2 && x <= width - 3);
}

/** Edge length of one node-marker cell: the plate plus the check badge's overhang. */
function getNodeFrameSize(): number {
  return MAP_MARKER_PLATE_SIZE_PX + MAP_MARKER_CHECK.overhangPx;
}

function getNodeTypeIndex(type: MapNodeType): number {
  return Object.keys(MAP_NODE_MARKER_STYLES).indexOf(type);
}

/**
 * Where a node marker's sprite sits in the atlas, at scale 1. The plate is at the cell's
 * bottom-left; the space above and to the right of it holds the check badge.
 *
 * @param type The node's type.
 * @param state How the marker draws.
 */
export function getMarkerAtlasFrame(type: MapNodeType, state: NodeMarkerState): PixelRect {
  const size = getNodeFrameSize();
  return {
    x: MAP_NODE_MARKER_STATES.indexOf(state) * size,
    y: getNodeTypeIndex(type) * size,
    width: size,
    height: size,
  };
}

/**
 * Where a floating symbol or ground shadow sits in the atlas, at scale 1: in the row
 * below the node markers, left to right.
 *
 * @param extra Which sprite.
 */
export function getMarkerAtlasExtraFrame(extra: MarkerAtlasExtra): PixelRect {
  const y = Object.keys(MAP_NODE_MARKER_STYLES).length * getNodeFrameSize();
  const symbol = JIRBY_SYMBOL_SHEET.cellSize;
  const { height, plateWidth, floatWidth } = MAP_MARKER_SHADOW;

  switch (extra) {
    case 'floorLoot':
      return { x: 0, y, width: symbol, height: symbol };
    case 'dialogueTrigger':
      return { x: symbol, y, width: symbol, height: symbol };
    case 'plateShadow':
      return { x: symbol * 2, y, width: plateWidth, height };
    case 'floatShadow':
      return { x: symbol * 2 + plateWidth, y, width: floatWidth, height };
  }
}

function paintPlate(ctx: CanvasRenderingContext2D, left: number, top: number, palette: MarkerPlatePalette): void {
  const size = MAP_MARKER_PLATE_SIZE_PX;
  const colors: Record<PlatePixelRole, string> = { outline: MAP_MARKER_OUTLINE_COLOR, ...palette };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const role = getPlatePixelRole(x, y, size);
      if (!role) continue;
      ctx.fillStyle = colors[role];
      ctx.fillRect(left + x, top + y, 1, 1);
    }
  }
}

function paintShadow(ctx: CanvasRenderingContext2D, frame: PixelRect): void {
  ctx.fillStyle = MAP_MARKER_SHADOW.color;
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      if (isShadowPixel(x, y, frame.width)) ctx.fillRect(frame.x + x, frame.y + y, 1, 1);
    }
  }
}

function blit(
  ctx: CanvasRenderingContext2D,
  symbols: HTMLImageElement,
  source: PixelRect | null,
  x: number,
  y: number,
) {
  if (!source) return;
  ctx.drawImage(symbols, source.x, source.y, source.width, source.height, x, y, source.width, source.height);
}

function paintNodeFrame(
  ctx: CanvasRenderingContext2D,
  symbols: HTMLImageElement,
  type: MapNodeType,
  state: NodeMarkerState,
): void {
  const frame = getMarkerAtlasFrame(type, state);
  const style = MAP_NODE_MARKER_STYLES[type];
  const plateX = frame.x;
  const plateY = frame.y + MAP_MARKER_CHECK.overhangPx;
  const isGrey = state === 'done';

  paintPlate(ctx, plateX, plateY, isGrey ? MAP_MARKER_DONE_PLATE : style.plate);

  const symbol = isGrey
    ? getJirbySymbolRect('white', style.whiteSymbol, false)
    : getJirbySymbolRect('color', style.symbol, false);
  blit(ctx, symbols, symbol, plateX + MAP_MARKER_SYMBOL_INSET_PX, plateY + MAP_MARKER_SYMBOL_INSET_PX);

  if (state === 'todo') return;
  const check = getJirbySymbolRect('color', MAP_MARKER_CHECK.symbol, false);
  if (!check) return;
  const { crop } = MAP_MARKER_CHECK;
  const badge = { x: check.x + crop.x, y: check.y + crop.y, width: crop.width, height: crop.height };
  blit(ctx, symbols, badge, frame.x + frame.width - crop.width, frame.y);
}

/**
 * Paints the whole marker atlas from the Jirby symbol sheet.
 *
 * @param symbols The loaded symbol sheet.
 * @returns The atlas canvas, or `null` when a 2D context is unavailable.
 */
export function buildMapMarkerAtlas(symbols: HTMLImageElement): HTMLCanvasElement | null {
  const frameSize = getNodeFrameSize();
  const types = Object.keys(MAP_NODE_MARKER_STYLES) as MapNodeType[];
  const extrasRow = getMarkerAtlasExtraFrame('floorLoot');

  const canvas = document.createElement('canvas');
  canvas.width = MAP_NODE_MARKER_STATES.length * frameSize;
  canvas.height = extrasRow.y + extrasRow.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  for (const type of types) {
    for (const state of MAP_NODE_MARKER_STATES) paintNodeFrame(ctx, symbols, type, state);
  }

  const loot = getMarkerAtlasExtraFrame('floorLoot');
  blit(ctx, symbols, getJirbySymbolRect('color', MAP_FLOOR_LOOT_SYMBOL, true), loot.x, loot.y);
  const trigger = getMarkerAtlasExtraFrame('dialogueTrigger');
  blit(ctx, symbols, getJirbySymbolRect('color', MAP_DIALOGUE_TRIGGER_SYMBOL, true), trigger.x, trigger.y);
  paintShadow(ctx, getMarkerAtlasExtraFrame('plateShadow'));
  paintShadow(ctx, getMarkerAtlasExtraFrame('floatShadow'));

  return canvas;
}

// One atlas per loaded sheet, painted on first use.
const atlasCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

/**
 * The marker atlas, once the symbol sheet has loaded. Cheap to call every frame: after
 * the first paint it's two cache lookups.
 *
 * @returns The atlas, or `null` while the sheet is still loading.
 */
export function getReadyMapMarkerAtlas(): HTMLCanvasElement | null {
  const symbols = getCachedImage(JIRBY_SYMBOL_SHEET.image);
  if (!isImageReady(symbols)) return null;

  const cached = atlasCache.get(symbols);
  if (cached) return cached;

  const atlas = buildMapMarkerAtlas(symbols);
  if (atlas) atlasCache.set(symbols, atlas);
  return atlas;
}
