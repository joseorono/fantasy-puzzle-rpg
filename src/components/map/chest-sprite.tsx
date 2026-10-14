import type { ChestAnimationRow, ChestVariant } from '~/types/chest';
import { CHEST_IDLE_FRAME_MS, CHEST_OPENING, CHEST_SPRITE_SHEET } from '~/constants/chest';
import { getChestSheetRow } from '~/lib/chest-sprite';
import { cn } from '~/lib/utils';

interface ChestSpriteProps {
  variant: ChestVariant;
  /** `idle` loops the glint row; `open` plays the lid once and holds on the last frame. */
  animation: ChestAnimationRow;
  /** Whole-number display scale; the art stays pixelated. */
  scale: number;
  className?: string;
}

/**
 * One chest from Admurin's sheet as a DOM sprite. A frame-sized box clips the sheet; the strip
 * inside it picks the row with a static offset and steps through the frames by translating itself.
 */
export function ChestSprite({ variant, animation, scale, className }: ChestSpriteProps) {
  const { image, frameWidth, frameHeight, framesPerRow } = CHEST_SPRITE_SHEET;
  const frameMs = animation === 'idle' ? CHEST_IDLE_FRAME_MS : CHEST_OPENING.openFrameMs;

  return (
    <div className={cn('chest-sprite', className)} style={{ width: frameWidth * scale, height: frameHeight * scale }}>
      <div
        // Remount on a row change so the new animation starts from its first frame.
        key={animation}
        className={cn('chest-sprite__strip', `chest-sprite__strip--${animation}`)}
        style={{
          backgroundImage: `url('${image}')`,
          top: `${-getChestSheetRow(variant, animation) * 100}%`,
          animationDuration: `${framesPerRow * frameMs}ms`,
          // Literal, not a custom property: that is what keeps the step on the compositor.
          animationTimingFunction:
            animation === 'idle' ? `steps(${framesPerRow}, end)` : `steps(${framesPerRow}, jump-none)`,
        }}
      />
    </div>
  );
}
