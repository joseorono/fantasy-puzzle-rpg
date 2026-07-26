import React from 'react';
import { getSpriteFrameOrigin } from '~/lib/character-sprite';
import { CHARACTER_SPRITE_SHEET_PATH, SPRITE_FRAME_SIZE_PX, CHARACTER_HEIGHT_TILES } from '~/constants/character-sprite';
import type { SpriteState } from '~/hooks/use-character-sprite';
import '~/styles/map-character-sprite.css';

interface MapCharacterSpriteProps {
  /** Continuous pixel X position of the character's feet anchor. */
  pixelX: number;
  /** Continuous pixel Y position of the character's feet anchor. */
  pixelY: number;
  /** The pixel size of one map tile (before display scaling). */
  tileSize: number;
  /**
   * Extra scale factor from CSS canvas sizing. The component internally computes
   * the sprite scale as `(tileSize * CHARACTER_HEIGHT_TILES / 64) * displayScale`.
   */
  displayScale: number;
  /** Current animation state from `useCharacterSprite`. */
  spriteState: SpriteState;
}

/**
 * Renders an LPC character sprite on the map using CSS background-position.
 *
 * The component lays out a 64×64 pixel div, scales it to match the character
 * height (2.5 tiles), and centres it horizontally on the (pixelX, pixelY) anchor
 * with the feet sitting on that point. Smoothness is provided by the rAF
 * movement loop — this component uses no CSS transitions.
 */
const MapCharacterSprite: React.FC<MapCharacterSpriteProps> = ({
  pixelX,
  pixelY,
  tileSize,
  displayScale,
  spriteState,
}) => {
  const { mode, facing, frameIndex } = spriteState;
  const { x, y } = getSpriteFrameOrigin(mode, facing, frameIndex);

  const scale = (tileSize * CHARACTER_HEIGHT_TILES / SPRITE_FRAME_SIZE_PX) * displayScale;

  return (
    <div
      className="map-character-sprite-wrapper"
      style={{
        position: 'absolute',
        left: pixelX,
        top: pixelY,
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
          imageRendering: 'pixelated',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          position: 'absolute',
          left: -(SPRITE_FRAME_SIZE_PX / 2),
          bottom: 0,
        }}
      />
    </div>
  );
};

export default MapCharacterSprite;
