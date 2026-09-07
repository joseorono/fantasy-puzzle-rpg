import type { NavDirection } from '~/constants/keyboard';
import {
  SPRITE_FRAME_SIZE_PX,
  SPRITE_DIRECTION_ROW,
  SPRITE_RUN_BLOCK_Y,
  SPRITE_SIT_BLOCK_Y,
  SPRITE_WALK_BLOCK_Y,
  SPRITE_WALK_BODY_BOX,
  WALK_STAND_COLUMN,
  RUN_FRAME_COUNT,
  WALK_FRAME_COUNT,
} from '~/constants/character-sprite';
import { MAX_COLLISION_INSET_TILES } from '~/constants/map-movement';

/** The modes a character sprite can be in at any moment. */
export type CharacterSpriteMode = 'walk' | 'run' | 'stand' | 'sit';

/**
 * Computes the top-left pixel origin of a specific frame in the spritesheet.
 *
 * The sheet is laid out in three vertical blocks with a 2px gutter between
 * them: run at Y=0, sit at Y=258, walk/stand at Y=516. Within each block,
 * rows map to directions and columns to animation frames.
 */
export function getSpriteFrameOrigin(
  mode: CharacterSpriteMode,
  facing: NavDirection,
  frameIndex: number,
): { x: number; y: number } {
  const row = SPRITE_DIRECTION_ROW[facing];
  let col: number;
  let blockY: number;

  switch (mode) {
    case 'run':
      col = frameIndex;
      blockY = SPRITE_RUN_BLOCK_Y;
      break;
    case 'sit':
      col = frameIndex;
      blockY = SPRITE_SIT_BLOCK_Y;
      break;
    case 'walk':
      col = frameIndex + 1; // columns 1–8; column 0 is the stand frame
      blockY = SPRITE_WALK_BLOCK_Y;
      break;
    case 'stand':
      col = WALK_STAND_COLUMN; // column 0 in the walk block
      blockY = SPRITE_WALK_BLOCK_Y;
      break;
  }

  return {
    x: col * SPRITE_FRAME_SIZE_PX,
    y: blockY + row * SPRITE_FRAME_SIZE_PX,
  };
}

/**
 * Advances a frame index within a given mode's animation cycle.
 * Knows the looping behaviour for each mode (wrap, toggle, or stay).
 */
export function advanceFrame(mode: CharacterSpriteMode, frameIndex: number): number {
  switch (mode) {
    case 'run':
      return (frameIndex + 1) % RUN_FRAME_COUNT;
    case 'walk':
      return (frameIndex + 1) % WALK_FRAME_COUNT;
    case 'sit':
      return frameIndex === 0 ? 1 : 0; // toggle between the two sit frames
    case 'stand':
      return 0;
  }
}

/** Everything the map needs to draw and collide the character at a given tile size. */
export interface CharacterSpriteMetrics {
  /** Sprite pixels to CSS pixels, including `displayScale`. Feeds the CSS transform. */
  scale: number;
  /** Rendered edge length of one square frame, in CSS pixels. */
  frameSizePx: number;
  /** Visible body width in *map* pixels. Display-independent. */
  bodyWidthPx: number;
  /** Visible body height in *map* pixels. Display-independent. */
  bodyHeightPx: number;
  /** Collision half-width in *map* pixels, clamped. Display-independent. */
  collisionInsetPx: number;
  /** How far below the collision point to draw the sprite, in CSS pixels. */
  footOffsetPx: number;
}

/**
 * Derives every size the character needs from its *visible body*, not from the
 * mostly-empty 64px frame.
 *
 * Splitting map pixels from CSS pixels is the point of this function. `scale` and
 * `frameSizePx` are what gets drawn, so they carry `displayScale`. `bodyWidthPx` and
 * `collisionInsetPx` feed the movement simulation, which runs entirely in map-pixel
 * space, so they must never see `displayScale` — otherwise collision would change
 * when the window is resized.
 *
 * The collision inset is the body's half-width, clamped by
 * {@link MAX_COLLISION_INSET_TILES}. Because the clamp can only ever *lower* it, the
 * character can never stop short of a wall with a visible gap; the clamp only leaves
 * some residual overlap on maps whose sprite is wide relative to a tile.
 *
 * @param tileSize Edge length of one map tile in map pixels.
 * @param bodyHeightTiles How many tiles tall the visible body should render.
 * @param displayScale CSS scale the canvas is currently displayed at.
 * @param footOffsetTiles How far below the collision point to draw the sprite, in tiles.
 */
export function getCharacterSpriteMetrics(
  tileSize: number,
  bodyHeightTiles: number,
  displayScale: number,
  footOffsetTiles: number,
): CharacterSpriteMetrics {
  const spriteScale = (tileSize * bodyHeightTiles) / SPRITE_WALK_BODY_BOX.height;
  const bodyWidthPx = SPRITE_WALK_BODY_BOX.width * spriteScale;
  const collisionInsetTiles = Math.min(bodyWidthPx / 2 / tileSize, MAX_COLLISION_INSET_TILES);

  return {
    scale: spriteScale * displayScale,
    frameSizePx: SPRITE_FRAME_SIZE_PX * spriteScale * displayScale,
    bodyWidthPx,
    bodyHeightPx: SPRITE_WALK_BODY_BOX.height * spriteScale,
    collisionInsetPx: collisionInsetTiles * tileSize,
    footOffsetPx: footOffsetTiles * tileSize * displayScale,
  };
}
