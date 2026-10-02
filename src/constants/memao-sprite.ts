/*
 * Sprite sheets exported by Memao Sprite Sheet Creator (Sleeping Robot Games / Memao).
 * https://sleeping-robot-games.itch.io/sprite-sheet-creator
 *
 * A sheet is a packed stream of 48x48 frames, 8 per row, read left to right. Each
 * animation stores all its frames for one direction, then the next, in
 * MEMAO_DIRECTIONS order. Timings and sequences come from the official demo GIFs.
 */

/** Width/height in pixels of a single frame. */
export const MEMAO_FRAME_SIZE_PX = 48;

/** Frames per row of the exported sheet. */
export const MEMAO_SHEET_COLUMNS = 8;

/** Direction order inside every animation block. */
export const MEMAO_DIRECTIONS = ['down', 'up', 'left', 'right'] as const;

export type MemaoDirection = (typeof MEMAO_DIRECTIONS)[number];

/** Sprite sheet paths for each Memao character. */
export const MEMAO_SHEETS = {
  mage: '/assets/sprite/party-memao-mage.png',
} as const;

export interface MemaoAnimationDefinition {
  name: string;
  /** Frames stored in the sheet for each direction. */
  framesPerDirection: number;
  /** Display time of each playback step, in ms. One entry per step. */
  frameDurationsMs: readonly number[];
  /** Playback order of frames when it isn't simply 0..n-1. */
  sequence?: readonly number[];
  /** Directions present in the sheet, when not all four. */
  directions?: readonly MemaoDirection[];
  /** One-shot animation that ends on, and stays at, its last frame. */
  holdsLastFrame?: boolean;
}

/**
 * Every animation, in sheet order. The order *is* the layout: an animation's start
 * frame is the sum of every block before it, so never reorder these entries.
 */
export const MEMAO_ANIMATIONS = [
  { name: 'idle', framesPerDirection: 4, frameDurationsMs: [500, 300, 200, 200] },
  { name: 'walk', framesPerDirection: 6, frameDurationsMs: [120, 120, 120, 120, 120, 120] },
  { name: 'run', framesPerDirection: 6, frameDurationsMs: [100, 100, 100, 100, 100, 100] },
  { name: 'pickUp', framesPerDirection: 4, frameDurationsMs: [130, 130, 130, 500] },
  { name: 'strike', framesPerDirection: 4, frameDurationsMs: [130, 130, 130, 130] },
  { name: 'chop', framesPerDirection: 4, frameDurationsMs: [130, 130, 130, 130] },
  { name: 'seed', framesPerDirection: 3, frameDurationsMs: [300, 130, 200] },
  {
    name: 'water',
    framesPerDirection: 4,
    sequence: [0, 1, 2, 3, 2, 1],
    frameDurationsMs: [300, 130, 130, 300, 130, 130],
  },
  { name: 'reap', framesPerDirection: 4, frameDurationsMs: [130, 130, 130, 130] },
  { name: 'slash', framesPerDirection: 4, frameDurationsMs: [130, 130, 130, 130] },
  { name: 'hurt', framesPerDirection: 2, frameDurationsMs: [150, 150] },
  { name: 'downed', framesPerDirection: 2, frameDurationsMs: [150, 150], holdsLastFrame: true },
  { name: 'death', framesPerDirection: 3, frameDurationsMs: [250, 150, 1000], holdsLastFrame: true },
  { name: 'eat', framesPerDirection: 3, frameDurationsMs: [100, 130, 130] },
  { name: 'drink', framesPerDirection: 3, frameDurationsMs: [100, 200, 130] },
  {
    name: 'wave',
    framesPerDirection: 4,
    sequence: [0, 1, 2, 1, 2, 1, 2, 3],
    frameDurationsMs: [100, 200, 130, 130, 130, 130, 130, 130],
  },
  { name: 'laugh', framesPerDirection: 3, frameDurationsMs: [100, 200, 130] },
  { name: 'shrug', framesPerDirection: 4, frameDurationsMs: [100, 200, 400, 200] },
  { name: 'think', framesPerDirection: 4, frameDurationsMs: [100, 200, 400, 200] },
  { name: 'sit', framesPerDirection: 4, frameDurationsMs: [100, 200, 400, 1000], holdsLastFrame: true },
  { name: 'read', framesPerDirection: 4, frameDurationsMs: [500, 300, 200, 200] },
  { name: 'paint', framesPerDirection: 4, frameDurationsMs: [200, 200, 200, 200], directions: ['left', 'right'] },
] as const satisfies readonly MemaoAnimationDefinition[];

export type MemaoAnimationName = (typeof MEMAO_ANIMATIONS)[number]['name'];

/** Sheet row the feet rest on, in every pose. The 7px below it are empty. */
export const MEMAO_FOOT_BASELINE_PX = 41;

/** An opaque bounding box inside a sprite frame, in sprite pixels. */
export interface SpriteBodyBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/*
 * Measured off the mage sheet (alpha > 16). Memao characters share one body template,
 * so these hold for every sheet unless an outfit adds bulk (hats, wings, cloaks).
 */

/** Idle and walk poses: the sizing and collision reference. */
export const MEMAO_STAND_WALK_BODY_BOX: SpriteBodyBox = { x: 12, y: 1, width: 24, height: 40 };

export const MEMAO_RUN_BODY_BOX: SpriteBodyBox = { x: 10, y: 2, width: 28, height: 39 };

export const MEMAO_SIT_BODY_BOX: SpriteBodyBox = { x: 9, y: 3, width: 30, height: 38 };

/** Union of the map poses (idle, walk, run, sit). */
export const MEMAO_UNION_BODY_BOX: SpriteBodyBox = { x: 9, y: 1, width: 30, height: 40 };
