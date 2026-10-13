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

/** Gap left between the character's leading edge and a blocking tile edge, in map pixels. */
export const COLLISION_EPSILON_PX = 0.01;

/**
 * Hard ceiling on the character's collision footprint, as a fraction of a tile.
 *
 * The footprint is derived from the sprite's real body half-width, then clamped here.
 * The clamp is not cosmetic: measured by flood fill over the shipped layer data, an
 * inset of 0.5 leaves only 127 of the Apprentice Forge's 367 walkable tiles reachable,
 * because the map breaks into disconnected pockets at every tile-wide gap. Everything
 * up to 0.4375 keeps all three maps fully connected. Do not raise this above 0.4375.
 */
export const MAX_COLLISION_INSET_TILES = 0.4;

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

// --- pointer (click-and-hold) movement ---

/**
 * Pointer closer than this to the character (in tiles) produces no movement.
 * Without it the character would jitter once it arrives under the cursor.
 */
export const POINTER_DEAD_ZONE_TILES = 0.8;

/**
 * At or beyond this pointer distance (in tiles) the character runs.
 * Roughly one and a third body heights (`CHARACTER_BODY_HEIGHT_TILES`), so "pull the
 * cursor about a body-length away" reads naturally on screen.
 */
export const POINTER_RUN_DISTANCE_TILES = 3.5;

/**
 * Once running, the character keeps running until the pointer comes this much
 * nearer than the threshold — stops the gait flickering when the cursor hovers
 * right on the boundary.
 */
export const POINTER_RUN_HYSTERESIS_TILES = 0.75;
