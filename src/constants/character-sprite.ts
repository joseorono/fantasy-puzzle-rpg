import type { NavDirection } from '~/constants/keyboard';

/** Path to the LPC spritesheet for the player character. */
export const CHARACTER_SPRITE_SHEET_PATH = '/assets/sprite/placeholder.png';

/** Width/height in pixels of a single sprite frame in the sheet. */
export const SPRITE_FRAME_SIZE_PX = 64;

/** Y-offset of the run animation block (top row, 8 frames). */
export const SPRITE_RUN_BLOCK_Y = 0;

/** Y-offset of the sit animation block (2 frames used of 3 available). */
export const SPRITE_SIT_BLOCK_Y = 258;

/** Y-offset of the walk/stand animation block (stand col 0 + 8 walk frames). */
export const SPRITE_WALK_BLOCK_Y = 516;

/**
 * Maps a navigation direction to the sprite row within each animation block.
 * Row 0 = up, 1 = left, 2 = down, 3 = right.
 */
export const SPRITE_DIRECTION_ROW: Record<NavDirection, number> = {
  up: 0,
  left: 1,
  down: 2,
  right: 3,
};

/** Number of frames in the run animation cycle. */
export const RUN_FRAME_COUNT = 8;

/** Number of frames in the walk animation cycle (columns 1–8). */
export const WALK_FRAME_COUNT = 8;

/** Column 0 of the walk block is the neutral stand frame. */
export const WALK_STAND_COLUMN = 0;

/** Number of sit frames used from the spritesheet (sheet has 3; we use the first two). */
export const SIT_FRAME_COUNT = 2;

/** An opaque bounding box inside a 64x64 sprite frame, in sprite pixels. */
export interface SpriteBodyBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/*
 * The boxes below were measured off the sheet (alpha > 16). They exist because a
 * frame is mostly empty: sizing off the raw 64px frame silently includes 16px of
 * transparent headroom, which is how the character ended up exactly one tile wide
 * on a 32px map. Re-measure only if the spritesheet is replaced.
 */

/**
 * Stand and walk poses. The sizing and collision reference, because it is the pose
 * the character is in whenever it moves or stands beside a wall.
 */
export const SPRITE_WALK_BODY_BOX: SpriteBodyBox = { x: 17, y: 16, width: 32, height: 48 };

/** Run pose: narrower than the walk pose, but fills the frame vertically. */
export const SPRITE_RUN_BODY_BOX: SpriteBodyBox = { x: 18, y: 0, width: 30, height: 64 };

/** Sit pose: the widest of the three. Only reached after {@link IDLE_SIT_DELAY_MS} standing still. */
export const SPRITE_SIT_BODY_BOX: SpriteBodyBox = { x: 14, y: 14, width: 38, height: 49 };

/** Union of every pose, for clipping the sprite to the map — a clip must fit the tallest frame. */
export const SPRITE_UNION_BODY_BOX: SpriteBodyBox = { x: 14, y: 0, width: 38, height: 64 };

/** The body's centre sits this far right of the frame's centre (frame x 32, body x 32.5). */
export const SPRITE_BODY_CENTER_OFFSET_PX = 0.5;

/**
 * How many tiles tall the character's *visible body* renders — not the frame.
 *
 * 2.625 = 3.5 x 48/64, i.e. exactly what the old frame-based 3.5 produced, so the
 * 16px maps are unchanged. Body width follows from the walk box's aspect ratio:
 * `bodyWidthTiles = bodyHeightTiles * 32/48`.
 */
export const CHARACTER_BODY_HEIGHT_TILES = 2.625;

/**
 * How far below its collision point the sprite is drawn, in tiles.
 *
 * The collision point rests at the tile's centre, so drawing the feet there reads as
 * hovering half a tile above the floor. This offset is render-only: the simulation
 * never sees it, so corner assist, path centering and pointer targeting are untouched.
 * Keep it at or below {@link MAX_COLLISION_INSET_TILES} — the collision footprint is
 * what stops the lowered feet from crossing into a wall below. 0 restores the old look.
 */
export const CHARACTER_FOOT_OFFSET_TILES = 0.25;

/**
 * Tiles the character must actually travel to advance one walk-cycle frame.
 *
 * Walk/run frames are driven by distance covered, not by a timer, so the legs
 * always match the ground: the cadence scales automatically with speed, and
 * pushing against a wall (zero distance) correctly stops the cycle instead of
 * moonwalking. At WALK_TILES_PER_SECOND this reproduces the ~110 ms cadence
 * the timer-based version used.
 */
export const WALK_TILES_PER_ANIM_FRAME = 0.55;

/** Same as WALK_TILES_PER_ANIM_FRAME for the run cycle (~80 ms at run speed). */
export const RUN_TILES_PER_ANIM_FRAME = 0.62;

/** Milliseconds between sit idle frame toggles. */
export const SIT_FRAME_INTERVAL_MS = 5_000;

/** Milliseconds of no movement before the character sits down. */
export const IDLE_SIT_DELAY_MS = 60_000;
