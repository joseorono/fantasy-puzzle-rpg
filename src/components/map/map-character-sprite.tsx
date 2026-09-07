import type { RefObject } from 'react';
import { getCharacterSpriteMetrics, getSpriteFrameOrigin } from '~/lib/character-sprite';
import {
  CHARACTER_SPRITE_SHEET_PATH,
  SPRITE_FRAME_SIZE_PX,
  CHARACTER_BODY_HEIGHT_TILES,
  CHARACTER_FOOT_OFFSET_TILES,
} from '~/constants/character-sprite';
import type { SpriteState } from '~/hooks/use-character-sprite';
import '~/styles/map-character-sprite.css';

interface MapCharacterSpriteProps {
  /**
   * Ref for the positioned wrapper. `useCharacterMovement` writes its
   * `transform` every animation frame, so position never passes through React.
   */
  positionRef: RefObject<HTMLDivElement | null>;
  /** The pixel size of one map tile, before display scaling. */
  tileSize: number;
  /** CSS scale the canvas is displayed at. */
  displayScale: number;
  /** Overrides the visible body height in tiles. Falls back to `CHARACTER_BODY_HEIGHT_TILES`. */
  characterBodyHeightTiles?: number;
  /** Overrides how far below the collision point the sprite is drawn, in tiles. */
  characterFootOffsetTiles?: number;
  /** Current animation state from `useCharacterSprite`. */
  spriteState: SpriteState;
}

/**
 * Renders an LPC character sprite on the map using CSS background-position.
 *
 * The wrapper is a zero-size anchor placed at the character's collision point by the
 * movement loop; the inner div holds one 64×64 frame, scaled so the *visible body* is
 * `CHARACTER_BODY_HEIGHT_TILES` tall and centred horizontally above that anchor. There
 * are no CSS transitions — smoothness comes from the rAF loop.
 *
 * The frame is pushed down by `characterFootOffsetTiles` so the feet land near the
 * bottom of the tile rather than on its centre line. That is a render-only shift: the
 * collision point does not move, and the collision footprint (which stops the character
 * short of a wall on every axis) is what keeps the lowered feet out of the tile below.
 */
export default function MapCharacterSprite({
  positionRef,
  tileSize,
  displayScale,
  characterBodyHeightTiles,
  characterFootOffsetTiles,
  spriteState,
}: MapCharacterSpriteProps) {
  const { mode, facing, frameIndex } = spriteState;
  const { x, y } = getSpriteFrameOrigin(mode, facing, frameIndex);

  const { scale, footOffsetPx } = getCharacterSpriteMetrics(
    tileSize,
    characterBodyHeightTiles ?? CHARACTER_BODY_HEIGHT_TILES,
    displayScale,
    characterFootOffsetTiles ?? CHARACTER_FOOT_OFFSET_TILES,
  );

  return (
    <div
      ref={positionRef}
      className="map-character-sprite-wrapper"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div
        className="map-character-sprite-inner"
        style={{
          width: SPRITE_FRAME_SIZE_PX,
          height: SPRITE_FRAME_SIZE_PX,
          backgroundImage: `url('${CHARACTER_SPRITE_SHEET_PATH}')`,
          backgroundPosition: `-${x}px -${y}px`,
          backgroundSize: 'auto',
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          position: 'absolute',
          left: -(SPRITE_FRAME_SIZE_PX / 2),
          // `bottom` is resolved before the transform and `transformOrigin` is the
          // element's own box, so this is an exact CSS-pixel shift, not a scaled one.
          // Rounded to keep pixel art on whole device pixels.
          bottom: -Math.round(footOffsetPx),
        }}
      />
    </div>
  );
}
