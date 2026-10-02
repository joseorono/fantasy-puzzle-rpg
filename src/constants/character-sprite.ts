import { MEMAO_ANIMATIONS, MEMAO_SHEETS } from '~/constants/memao-sprite';

/** Memao spritesheet for the player character on the map. */
export const CHARACTER_SPRITE_SHEET_PATH = MEMAO_SHEETS.mage;

/** Which Memao animation each map sprite mode plays. */
export const CHARACTER_MODE_ANIMATION = {
  stand: 'idle',
  walk: 'walk',
  run: 'run',
  sit: 'sit',
} as const;

/** Number of frames in the run animation cycle. */
export const RUN_FRAME_COUNT = MEMAO_ANIMATIONS.find((animation) => animation.name === 'run')!.framesPerDirection;

/** Number of frames in the walk animation cycle. */
export const WALK_FRAME_COUNT = MEMAO_ANIMATIONS.find((animation) => animation.name === 'walk')!.framesPerDirection;

/**
 * How many tiles tall the character's *visible body* renders — not the frame.
 *
 * 2.5 tiles = 40px on a 16px map, exactly the Memao body height, so the sprite draws
 * at 1x with crisp pixels. Body width follows from the stand/walk box's aspect ratio.
 */
export const CHARACTER_BODY_HEIGHT_TILES = 2.5;

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
 * moonwalking. At WALK_TILES_PER_SECOND this reproduces Memao's 120 ms walk frames.
 */
export const WALK_TILES_PER_ANIM_FRAME = 0.6;

/** Same as WALK_TILES_PER_ANIM_FRAME for the run cycle (Memao's 100 ms at run speed). */
export const RUN_TILES_PER_ANIM_FRAME = 0.775;

/** Milliseconds of no movement before the character sits down. */
export const IDLE_SIT_DELAY_MS = 60_000;
