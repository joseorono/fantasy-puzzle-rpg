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

/** How many tiles tall the character should render (used for the scale calculation). */
export const CHARACTER_HEIGHT_TILES = 3.5;

/** Milliseconds between walk animation frames. */
export const WALK_FRAME_MS = 110;

/** Milliseconds between run animation frames. */
export const RUN_FRAME_MS = 80;

/** Milliseconds between sit idle frame toggles. */
export const SIT_FRAME_INTERVAL_MS = 5_000;

/** Milliseconds of no movement before the character sits down. */
export const IDLE_SIT_DELAY_MS = 60_000;

/** Window after the last movement during which walk/run remains active. */
export const MOVE_ANIMATION_WINDOW_MS = 250;
