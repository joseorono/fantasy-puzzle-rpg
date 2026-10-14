import type { ChestAnimationRow, ChestVariant } from '~/types/chest';
import type { MapDefinition } from '~/types/map';
import type { InteractiveMapNode } from '~/types/map-node';
import type { GridPosition, PixelRect } from '~/types/geometry';
import {
  CHEST_IDLE_FRAME_MS,
  CHEST_IDLE_HOLD_MS,
  CHEST_IDLE_TILE_OFFSET_MS,
  CHEST_SPRITE_SHEET,
  CHEST_VARIANT_INDEX,
  DEFAULT_CHEST_VARIANT,
} from '~/constants/chest';
import { getCachedImage, isImageReady } from '~/lib/image-cache';

/**
 * The chest design a Treasure node draws with: its own override, else the map's, else the default.
 *
 * @param map The map the node sits on.
 * @param node The Treasure node.
 */
export function resolveChestVariant(
  map: Pick<MapDefinition, 'chestVariant'>,
  node: Pick<InteractiveMapNode, 'chestVariant'>,
): ChestVariant {
  return node.chestVariant ?? map.chestVariant ?? DEFAULT_CHEST_VARIANT;
}

/**
 * The sheet row a variant's animation lives on: each variant owns an idle row followed by an open row.
 *
 * @param variant The chest design.
 * @param row Which of its two animations.
 */
export function getChestSheetRow(variant: ChestVariant, row: ChestAnimationRow): number {
  return CHEST_VARIANT_INDEX[variant] * 2 + (row === 'open' ? 1 : 0);
}

/**
 * Where one frame sits on the chest sheet.
 *
 * @param variant The chest design.
 * @param row Which of its two animations.
 * @param frameIndex 0-based column; clamped to the row.
 */
export function getChestFrameRect(variant: ChestVariant, row: ChestAnimationRow, frameIndex: number): PixelRect {
  const { frameWidth, frameHeight, framesPerRow } = CHEST_SPRITE_SHEET;
  const column = Math.min(Math.max(0, Math.floor(frameIndex)), framesPerRow - 1);
  return {
    x: column * frameWidth,
    y: getChestSheetRow(variant, row) * frameHeight,
    width: frameWidth,
    height: frameHeight,
  };
}

/** The open row's last frame: lid thrown back, the resting look of a looted chest. */
export function getChestOpenedFrame(): number {
  return CHEST_SPRITE_SHEET.framesPerRow - 1;
}

/**
 * The idle frame to show at a moment: one pass through the glint row, then a rest on frame 0.
 *
 * @param timestampMs A `requestAnimationFrame` / `performance.now()` timestamp.
 * @param offsetMs Shifts this chest's cycle, so neighbours don't glint in unison.
 */
export function getChestIdleFrame(timestampMs: number, offsetMs: number = 0): number {
  const playMs = CHEST_SPRITE_SHEET.framesPerRow * CHEST_IDLE_FRAME_MS;
  const cycleMs = playMs + CHEST_IDLE_HOLD_MS;
  const elapsed = (((timestampMs + offsetMs) % cycleMs) + cycleMs) % cycleMs;
  if (elapsed >= playMs) return 0;
  return Math.floor(elapsed / CHEST_IDLE_FRAME_MS);
}

/**
 * A stable per-tile offset for {@link getChestIdleFrame}.
 *
 * @param tile The chest's tile.
 */
export function getChestIdleOffset(tile: GridPosition): number {
  return tile.row * CHEST_IDLE_TILE_OFFSET_MS.row + tile.col * CHEST_IDLE_TILE_OFFSET_MS.col;
}

/**
 * The chest sheet, once loaded. Cheap to call every frame.
 *
 * @returns The image, or `null` while it is still loading.
 */
export function getReadyChestSheet(): HTMLImageElement | null {
  const sheet = getCachedImage(CHEST_SPRITE_SHEET.image);
  return isImageReady(sheet) ? sheet : null;
}
