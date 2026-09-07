import type { NavDirection } from '~/constants/keyboard';
import {
  POINTER_DEAD_ZONE_TILES,
  POINTER_RUN_DISTANCE_TILES,
  POINTER_RUN_HYSTERESIS_TILES,
} from '~/constants/map-movement';

/**
 * A resolved movement request, in the shape the simulation consumes.
 *
 * Both input producers — keyboard and pointer — emit this, so the rAF loop has
 * exactly one thing to read and every input rule stays testable in isolation.
 */
export interface MovementIntent {
  /** Normalised direction X in [-1, 1]. Zero on both axes means "not moving". */
  dirX: number;
  /** Normalised direction Y in [-1, 1]. */
  dirY: number;
  /** Cardinal direction the sprite should face. */
  facing: NavDirection;
  /** Whether the character should run rather than walk. */
  running: boolean;
}

/** Raw pointer state, in map-pixel space. */
export interface PointerPoint {
  x: number;
  y: number;
}

/** Direction/gait carried between frames so hysteresis and facing stay stable. */
export interface IntentMemory {
  facing: NavDirection;
  running: boolean;
}

/** Just the rect fields we need, so tests don't have to build a full DOMRect. */
export interface CanvasOrigin {
  left: number;
  top: number;
}

/**
 * The eight unit vectors the character may travel along.
 *
 * A literal table rather than `cos`/`sin` output, so the components are exactly
 * `0`, `±1` and `±Math.SQRT1_2`. Both input sources resolve through this one
 * table — {@link keyboardToIntent} snaps too rather than normalising separately,
 * which would land one ULP away — so mouse and keyboard emit bit-identical
 * vectors and cannot drift apart.
 *
 * Indexed by octant, starting east and turning clockwise in screen space
 * (Y grows downward).
 */
const OCTANT_VECTORS: ReadonlyArray<{ dirX: number; dirY: number }> = [
  { dirX: 1, dirY: 0 }, // east
  { dirX: Math.SQRT1_2, dirY: Math.SQRT1_2 }, // south-east
  { dirX: 0, dirY: 1 }, // south
  { dirX: -Math.SQRT1_2, dirY: Math.SQRT1_2 }, // south-west
  { dirX: -1, dirY: 0 }, // west
  { dirX: -Math.SQRT1_2, dirY: -Math.SQRT1_2 }, // north-west
  { dirX: 0, dirY: -1 }, // north
  { dirX: Math.SQRT1_2, dirY: -Math.SQRT1_2 }, // north-east
];

const OCTANT_COUNT = OCTANT_VECTORS.length;
const RADIANS_PER_OCTANT = (Math.PI * 2) / OCTANT_COUNT;

/**
 * Converts a viewport (client) coordinate into map-pixel space — the inverse of
 * the transform that draws the character.
 *
 * @param clientX Viewport X, e.g. `PointerEvent.clientX`.
 * @param clientY Viewport Y.
 * @param canvasOrigin The canvas's viewport position (`getBoundingClientRect()`).
 * @param scale The canvas's display scale (rendered width / map-pixel width).
 * @returns The point in map pixels, or `null` when the scale isn't usable yet.
 */
export function clientToMapPoint(
  clientX: number,
  clientY: number,
  canvasOrigin: CanvasOrigin,
  scale: number,
): PointerPoint | null {
  if (!(scale > 0)) return null;
  return {
    x: (clientX - canvasOrigin.left) / scale,
    y: (clientY - canvasOrigin.top) / scale,
  };
}

/**
 * Snaps an arbitrary vector to the nearest of the eight travel directions.
 *
 * The map's roads are one tile wide and the simulation's path-centering assist
 * only engages on single-axis movement, so travelling at a free angle would
 * leave the character grazing tile borders the whole way. Snapping keeps
 * pointer movement as clean as keyboard movement.
 *
 * @returns A unit vector, or the zero vector when the input has no direction.
 */
export function snapToOctant(dx: number, dy: number): { dirX: number; dirY: number } {
  if (dx === 0 && dy === 0) return { dirX: 0, dirY: 0 };

  const octant = Math.round(Math.atan2(dy, dx) / RADIANS_PER_OCTANT);
  return OCTANT_VECTORS[((octant % OCTANT_COUNT) + OCTANT_COUNT) % OCTANT_COUNT];
}

/**
 * Chooses which way the sprite should face for a direction vector.
 *
 * The dominant axis wins. On an exact diagonal the previous facing is kept when
 * it is one of the two components, so turning east → south-east doesn't snap the
 * sprite around; only crossing to a genuinely different heading does.
 *
 * @param previousFacing Facing to keep when the vector is zero or ambiguous.
 */
export function directionToFacing(dirX: number, dirY: number, previousFacing: NavDirection): NavDirection {
  if (dirX === 0 && dirY === 0) return previousFacing;

  const horizontal: NavDirection = dirX > 0 ? 'right' : 'left';
  const vertical: NavDirection = dirY > 0 ? 'down' : 'up';

  if (Math.abs(dirX) > Math.abs(dirY)) return horizontal;
  if (Math.abs(dirY) > Math.abs(dirX)) return vertical;

  // Exact diagonal — stay put if the current facing still describes it.
  if (previousFacing === horizontal || previousFacing === vertical) return previousFacing;
  return horizontal;
}

/**
 * Decides walk vs run from how far the pointer is from the character.
 *
 * The threshold is lowered while already running, so a cursor resting on the
 * boundary can't flutter the gait (and with it the animation) every frame.
 *
 * @param distanceTiles Pointer-to-character distance, in tiles.
 * @param wasRunning Whether the character was running on the previous frame.
 */
export function shouldRunAtDistance(distanceTiles: number, wasRunning: boolean): boolean {
  const threshold = wasRunning ? POINTER_RUN_DISTANCE_TILES - POINTER_RUN_HYSTERESIS_TILES : POINTER_RUN_DISTANCE_TILES;
  return distanceTiles >= threshold;
}

/**
 * Builds the movement intent for a held pointer: travel toward it, at a gait
 * chosen by how far away it is.
 *
 * Inside {@link POINTER_DEAD_ZONE_TILES} the result is idle but *keeps* the
 * previous facing, so arriving under the cursor stops cleanly instead of
 * spinning the sprite.
 *
 * @param pointer Pointer position in map pixels.
 * @param character Character position in map pixels (its feet).
 * @param tileSize Map pixels per tile, used to express distances in tiles.
 * @param previous Facing and gait from the previous frame.
 */
export function resolvePointerIntent(
  pointer: PointerPoint,
  character: PointerPoint,
  tileSize: number,
  previous: IntentMemory,
): MovementIntent {
  const dx = pointer.x - character.x;
  const dy = pointer.y - character.y;
  const distanceTiles = Math.hypot(dx, dy) / tileSize;

  if (distanceTiles <= POINTER_DEAD_ZONE_TILES) {
    return { dirX: 0, dirY: 0, facing: previous.facing, running: false };
  }

  const { dirX, dirY } = snapToOctant(dx, dy);
  return {
    dirX,
    dirY,
    facing: directionToFacing(dirX, dirY, previous.facing),
    running: shouldRunAtDistance(distanceTiles, previous.running),
  };
}

/**
 * Turns held-key state into a movement intent.
 *
 * Held keys give `dx`/`dy` in `{-1, 0, 1}`, which would make a diagonal ~1.41×
 * faster than a cardinal. Rather than normalising separately, this routes
 * through {@link snapToOctant} — the same table the pointer uses — so both
 * input sources emit the exact same vectors and can never drift apart.
 */
export function keyboardToIntent(state: {
  dx: number;
  dy: number;
  facing: NavDirection;
  running: boolean;
}): MovementIntent {
  const { dirX, dirY } = snapToOctant(state.dx, state.dy);
  return { dirX, dirY, facing: state.facing, running: state.running };
}

/** Whether an intent actually asks the character to move. */
export function isMovingIntent(intent: MovementIntent): boolean {
  return intent.dirX !== 0 || intent.dirY !== 0;
}

/**
 * Picks which input source drives the character this frame.
 *
 * Keyboard wins whenever a direction key is held, so reaching for the keys
 * mid-drag takes over immediately rather than fighting the pointer. While the
 * pointer drives, the keyboard's run modifier still applies — holding Shift
 * forces a run at any distance.
 *
 * @param previousFacing Facing to keep when neither source is moving.
 */
export function mergeMovementIntents(
  keyboard: MovementIntent,
  pointer: MovementIntent,
  previousFacing: NavDirection,
): MovementIntent {
  if (isMovingIntent(keyboard)) return keyboard;

  if (isMovingIntent(pointer)) {
    return { ...pointer, running: pointer.running || keyboard.running };
  }

  return { dirX: 0, dirY: 0, facing: previousFacing, running: false };
}
