import type { NavDirection } from '~/constants/keyboard';
import { CHARACTER_MODE_ANIMATION } from '~/constants/character-sprite';
import { MEMAO_FOOT_BASELINE_PX, MEMAO_FRAME_SIZE_PX, MEMAO_STAND_WALK_BODY_BOX } from '~/constants/memao-sprite';
import { MAX_COLLISION_INSET_TILES } from '~/constants/map-movement';
import { getMemaoAnimation, getMemaoFrameOrigin, getMemaoStepCount } from '~/lib/memao-sprite';

/** The modes a character sprite can be in at any moment. */
export type CharacterSpriteMode = keyof typeof CHARACTER_MODE_ANIMATION;

/**
 * Computes the top-left pixel origin of a specific frame in the spritesheet.
 *
 * @param mode Sprite mode, mapped to its Memao animation.
 * @param facing Facing direction.
 * @param frameIndex Playback step within the mode's animation.
 */
export function getSpriteFrameOrigin(
  mode: CharacterSpriteMode,
  facing: NavDirection,
  frameIndex: number,
): { x: number; y: number } {
  return getMemaoFrameOrigin(CHARACTER_MODE_ANIMATION[mode], facing, frameIndex);
}

/**
 * Advances a frame index within a given mode's animation cycle. Looping animations
 * wrap; one-shots (sit) stay on their last frame.
 *
 * @param mode Sprite mode.
 * @param frameIndex Current playback step.
 */
export function advanceFrame(mode: CharacterSpriteMode, frameIndex: number): number {
  const animationName = CHARACTER_MODE_ANIMATION[mode];
  const stepCount = getMemaoStepCount(animationName);

  if (getMemaoAnimation(animationName).holdsLastFrame) {
    return Math.min(frameIndex + 1, stepCount - 1);
  }
  return (frameIndex + 1) % stepCount;
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
  /** Empty frame below the feet, in CSS pixels. Shifting down by it puts the feet on the anchor. */
  baselinePadPx: number;
}

/**
 * Derives every size the character needs from its *visible body*, not from the
 * partly-empty 48px frame.
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
  const spriteScale = (tileSize * bodyHeightTiles) / MEMAO_STAND_WALK_BODY_BOX.height;
  const bodyWidthPx = MEMAO_STAND_WALK_BODY_BOX.width * spriteScale;
  const collisionInsetTiles = Math.min(bodyWidthPx / 2 / tileSize, MAX_COLLISION_INSET_TILES);
  const scale = spriteScale * displayScale;

  return {
    scale,
    frameSizePx: MEMAO_FRAME_SIZE_PX * scale,
    bodyWidthPx,
    bodyHeightPx: MEMAO_STAND_WALK_BODY_BOX.height * spriteScale,
    collisionInsetPx: collisionInsetTiles * tileSize,
    footOffsetPx: footOffsetTiles * tileSize * displayScale,
    baselinePadPx: (MEMAO_FRAME_SIZE_PX - MEMAO_FOOT_BASELINE_PX) * scale,
  };
}
