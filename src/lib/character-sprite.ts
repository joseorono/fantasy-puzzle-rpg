import type { NavDirection } from '~/constants/keyboard';
import {
  SPRITE_FRAME_SIZE_PX,
  SPRITE_DIRECTION_ROW,
  SPRITE_RUN_BLOCK_Y,
  SPRITE_SIT_BLOCK_Y,
  SPRITE_WALK_BLOCK_Y,
  WALK_STAND_COLUMN,
  RUN_FRAME_COUNT,
  WALK_FRAME_COUNT,
} from '~/constants/character-sprite';

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
