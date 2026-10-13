import type { FoeDefinition, FoeMapStrip } from '~/types/foe';
import {
  FOE_DEFAULT_WALK_TWEEN,
  FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND,
  FOE_STRIP_IDLE_ROW,
  FOE_STRIP_MOVE_ROW,
  FOE_WALK_TWEEN_STYLE,
  FOE_WALK_TWEEN_TILES_PER_HOP,
} from '~/constants/foe';

/**
 * How a FOE looks on the map: which strip cell to draw and the procedural walk tween.
 * Everything returns plain numbers so the per-frame draw loop allocates nothing.
 */

/**
 * A FOE's walk-tween intensity: its own `walkTween`, else the default when its strip has
 * no move row to animate the walk, else 0.
 *
 * @param definition The FOE.
 */
export function resolveFoeWalkTween(definition: FoeDefinition): number {
  if (definition.walkTween !== undefined) return Math.max(0, definition.walkTween);
  return definition.mapStrip?.move ? 0 : FOE_DEFAULT_WALK_TWEEN;
}

/**
 * The strip row to draw: move while walking (if the strip has it), idle otherwise.
 *
 * @param strip The FOE's map strip.
 * @param isMoving Whether the FOE moved on the last step.
 */
export function getFoeStripRow(strip: FoeMapStrip, isMoving: boolean): number {
  return isMoving && strip.move ? FOE_STRIP_MOVE_ROW : FOE_STRIP_IDLE_ROW;
}

/**
 * The frame within `row` to draw. Idle steps with time; move steps with distance walked,
 * at the authored rate when walking at `FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND`.
 *
 * @param strip The FOE's map strip.
 * @param row From `getFoeStripRow`.
 * @param strideDistancePx Distance the FOE has walked, in map pixels.
 * @param timestampMs The frame's timestamp.
 * @param tileSize Map tile size in pixels.
 */
export function getFoeStripFrame(
  strip: FoeMapStrip,
  row: number,
  strideDistancePx: number,
  timestampMs: number,
  tileSize: number,
): number {
  const { move, idle } = strip;
  if (row === FOE_STRIP_MOVE_ROW && move) {
    const distancePerFramePx = (move.frameDurationMs / 1000) * FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND * tileSize;
    return Math.floor(strideDistancePx / distancePerFramePx) % move.frames;
  }
  return Math.floor(timestampMs / idle.frameDurationMs) % idle.frames;
}

/** 0 on the ground, 1 at the top of a hop. */
function hopHeight(strideDistancePx: number, tileSize: number): number {
  return Math.abs(Math.sin((Math.PI * strideDistancePx) / (FOE_WALK_TWEEN_TILES_PER_HOP * tileSize)));
}

/**
 * How far the walk tween lifts the sprite, in whole map pixels so it stays on the pixel grid.
 *
 * @param strideDistancePx Distance the FOE has walked, in map pixels.
 * @param tileSize Map tile size in pixels.
 * @param intensity The FOE's resolved `walkTween`; 0 gives 0.
 */
export function getFoeWalkLiftPx(strideDistancePx: number, tileSize: number, intensity: number): number {
  if (intensity <= 0) return 0;
  return Math.round(hopHeight(strideDistancePx, tileSize) * FOE_WALK_TWEEN_STYLE.hopPx * intensity);
}

/**
 * Vertical scale of the walk tween: stretched tall mid-hop, squashed flat on landing. Draw
 * with a horizontal scale of `1 / scaleY` to keep the volume.
 *
 * @param strideDistancePx Distance the FOE has walked, in map pixels.
 * @param tileSize Map tile size in pixels.
 * @param intensity The FOE's resolved `walkTween`; 0 gives 1.
 */
export function getFoeWalkScaleY(strideDistancePx: number, tileSize: number, intensity: number): number {
  if (intensity <= 0) return 1;
  return 1 + FOE_WALK_TWEEN_STYLE.squash * intensity * (2 * hopHeight(strideDistancePx, tileSize) - 1);
}
