import { CHARACTER_SPRITES } from '~/constants/party';
import {
  STELLA_CAST_FRAME_MS,
  STELLA_IDLE_CYCLE_MS,
  STELLA_SV_FRAMES_PER_MOTION,
  type StellaMotion,
  type StellaPlayMode,
} from '~/constants/stella-sprites';
import { getStellaMotionOrigin } from '~/lib/stella-sprites';
import { cn } from '~/lib/utils';
import type { CharacterClass } from '~/types/rpg-elements';

interface StellaBattlerSpriteProps {
  characterClass: CharacterClass;
  motion: StellaMotion;
  mode: StellaPlayMode;
  /** Display scale of the 128px frame. Omit to inherit `--battler-scale` from a parent (per-breakpoint CSS). */
  scale?: number;
  /** Full animation cycle in ms. Defaults to the idle cycle for loops and 3 cast frames for one-shots. */
  cycleMs?: number;
  /** Change to replay the current motion from frame 0 (e.g. back-to-back hits). */
  playId?: number;
  className?: string;
}

/**
 * One frame of a Stella side-view battler sheet, animated in CSS (`party-sprites.css`) by
 * translating a 3-frame strip, so frame steps run on the compositor. The frame is scaled from
 * its bottom edge so the feet stay planted at any scale.
 */
export function StellaBattlerSprite({
  characterClass,
  motion,
  mode,
  scale,
  cycleMs,
  playId = 0,
  className,
}: StellaBattlerSpriteProps) {
  const { x, y } = getStellaMotionOrigin(motion);
  const resolvedCycleMs =
    cycleMs ?? (mode === 'loop' ? STELLA_IDLE_CYCLE_MS : STELLA_CAST_FRAME_MS * STELLA_SV_FRAMES_PER_MOTION);

  return (
    <div
      className={cn('stella-battler', `stella-battler--${mode}`, className)}
      style={
        {
          '--battler-scale': scale,
          '--stella-x': x,
          '--stella-y': y,
          '--stella-cycle-ms': `${resolvedCycleMs}ms`,
        } as React.CSSProperties
      }
    >
      <div className="stella-battler__cell">
        {/* Keyed so a motion change (or a replay) restarts the animation from frame 0. */}
        <div
          key={`${motion}-${playId}`}
          className="stella-battler__strip"
          style={{ backgroundImage: `url('${CHARACTER_SPRITES[characterClass].battler}')` }}
        />
      </div>
    </div>
  );
}
