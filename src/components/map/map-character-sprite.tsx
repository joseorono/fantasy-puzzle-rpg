import type { RefObject } from 'react';
import { getSpriteFrameOrigin } from '~/lib/character-sprite';
import {
  CHARACTER_SPRITE_SHEET_PATH,
  SPRITE_FRAME_SIZE_PX,
  CHARACTER_HEIGHT_TILES,
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
  /** Current animation state from `useCharacterSprite`. */
  spriteState: SpriteState;
}

/**
 * Renders an LPC character sprite on the map using CSS background-position.
 *
 * The wrapper is a zero-size anchor placed at the character's feet by the
 * movement loop; the inner div holds one 64×64 frame, scaled to
 * `CHARACTER_HEIGHT_TILES` and centred horizontally above that anchor. There
 * are no CSS transitions — smoothness comes from the rAF loop.
 */
export default function MapCharacterSprite({
  positionRef,
  tileSize,
  displayScale,
  spriteState,
}: MapCharacterSpriteProps) {
  const { mode, facing, frameIndex } = spriteState;
  const { x, y } = getSpriteFrameOrigin(mode, facing, frameIndex);

  const scale = ((tileSize * CHARACTER_HEIGHT_TILES) / SPRITE_FRAME_SIZE_PX) * displayScale;

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
          bottom: 0,
        }}
      />
    </div>
  );
}
