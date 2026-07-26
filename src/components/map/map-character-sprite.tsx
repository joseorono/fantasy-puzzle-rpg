import React from 'react';
import { getSpriteFrameOrigin } from '~/lib/character-sprite';
import { CHARACTER_SPRITE_SHEET_PATH, SPRITE_FRAME_SIZE_PX, CHARACTER_HEIGHT_TILES } from '~/constants/character-sprite';
import type { SpriteState } from '~/hooks/use-character-sprite';
import '~/styles/map-character-sprite.css';

interface MapCharacterSpriteProps {
  /** Tile-space position of the character (row/col on the map grid). */
  position: { row: number; col: number };
  /** The pixel size of one map tile (before display scaling). */
  tileSize: number;
  /**
   * Extra scale factor from CSS canvas sizing. The component internally computes
   * the sprite scale as `(tileSize * CHARACTER_HEIGHT_TILES / 64) * displayScale`.
   */
  displayScale: number;
  /** Current animation state from `useCharacterSprite`. */
  spriteState: SpriteState;
  /** When true, the wrapper smoothly transitions between tile positions. */
  enableTransition?: boolean;
}

/**
 * Renders an LPC character sprite on the map using CSS background-position.
 *
 * The component lays out a 64×64 pixel div, scales it to match the character
 * height (2.5 tiles), and shifts it so the character's feet sit on the target
 * tile. Transitions are off by default and enabled after the first canvas draw
 * to avoid a slide-in on mount.
 */
const MapCharacterSprite: React.FC<MapCharacterSpriteProps> = ({
  position,
  tileSize,
  displayScale,
  spriteState,
  enableTransition = false,
}) => {
  const { mode, facing, frameIndex } = spriteState;
  const { x, y } = getSpriteFrameOrigin(mode, facing, frameIndex);

  const scale = (tileSize * CHARACTER_HEIGHT_TILES / SPRITE_FRAME_SIZE_PX) * displayScale;

  return (
    <div
      className="map-character-sprite-wrapper"
      style={{
        position: 'absolute',
        left: position.col * tileSize * displayScale,
        top: position.row * tileSize * displayScale,
        transition: enableTransition ? 'left 0.2s ease-out, top 0.2s ease-out' : 'none',
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
