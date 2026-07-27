/**
 * Tunables for map character movement.
 *
 * All distances are expressed in *tiles* (or ratios of walk speed) so they stay
 * meaningful regardless of a map's tile size or the canvas's display scale.
 * The movement simulation runs entirely in map-pixel space; `displayScale` is
 * applied only when the sprite is drawn.
 */

/** Tiles traversed per second at walk speed. */
export const WALK_TILES_PER_SECOND = 5;

/** Run (Shift) speed multiplier over walk speed. */
export const RUN_SPEED_MULTIPLIER = 1.55;

/**
 * Fixed simulation substep. The rAF loop accumulates real time and consumes it
 * in steps of this size, so movement is frame-rate independent and a fast
 * character can never tunnel through a blocking tile.
 */
export const MOVEMENT_STEP_SECONDS = 1 / 120;

/**
 * Longest stretch of real time a single frame may simulate. Anything beyond
 * this (tab restore, GC pause) is discarded rather than replayed, so a hitch
 * never teleports the character.
 */
export const MAX_FRAME_SECONDS = 0.25;

/** Gap left between the character point and a blocking tile edge, in map pixels. */
export const COLLISION_EPSILON_PX = 0.01;

// --- road assists ---

/**
 * Perpendicular pull toward the centre of the current tile while moving along a
 * single axis, as a ratio of walk speed. Keeps the character off tile borders
 * on narrow roads, which is where collision feels finicky.
 */
export const PATH_CENTERING_SPEED_RATIO = 0.45;

/** Stop centring once within this fraction of a tile of the centre line (prevents hunting). */
export const PATH_CENTERING_DEADZONE_TILES = 0.04;

/**
 * Largest perpendicular misalignment (as a fraction of a tile) that corner
 * assist will nudge the character across to slip around a corner.
 */
export const CORNER_ASSIST_MAX_OFFSET_TILES = 0.45;

/** Corner-assist nudge speed, as a ratio of walk speed. */
export const CORNER_ASSIST_SPEED_RATIO = 0.9;
