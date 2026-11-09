import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ENEMY_SPRITE_CROSSFADE_MS } from '~/constants/battle';
import {
  getAdmurinAnimationStepCount,
  getAdmurinAnimationTimingFunctionForSupport,
  getAdmurinBackgroundSize,
  getAdmurinPlacement,
  getAdmurinRowBackgroundPosition,
  SUPPORTS_ADMURIN_FRAME_SEQUENCE,
} from '~/lib/admurin-enemy-sheet';
import { cn } from '~/lib/utils';
import type { AdmurinEnemyAnimation, AdmurinEnemySheet } from '~/types/admurin-enemies';

interface AdmurinEnemySpriteProps {
  sheet: AdmurinEnemySheet;
  animation: AdmurinEnemyAnimation;
  mode: 'loop' | 'once';
  playId: number;
  paused: boolean;
  className?: string;
}

/**
 * One Admurin enemy sheet row, stepped in CSS (`admurin-enemy-sprites.css`) by translating the
 * strip, so the frames change on the compositor — the same technique as `StellaBattlerSprite`.
 * The strip is keyed on the row + playId, so a motion change (or a replay) restarts at frame 0.
 *
 * `className` lands on the clipping box: state classes like `enemy-staggered` go there, because
 * their transform would otherwise fight the strip's frame transform.
 */
export function AdmurinEnemySprite({ sheet, animation, mode, playId, paused, className }: AdmurinEnemySpriteProps) {
  const stepCount = getAdmurinAnimationStepCount(animation, SUPPORTS_ADMURIN_FRAME_SEQUENCE);
  const animates = stepCount > 1;
  const placement = getAdmurinPlacement(sheet, animation);
  const crossfadeMs = animation.crossfadeMs ?? ENEMY_SPRITE_CROSSFADE_MS;

  // On a row switch the previous row lingers as a fading "ghost" under the incoming one — poses
  // sit at different heights inside their rows, so a hard cut reads as a vertical jump. The ghost
  // is a static strip at frame 0: exactly what a finished one-shot was already showing (fill-mode
  // none), and close enough to any idle frame for the dissolve to mask the difference.
  const [ghost, setGhost] = useState<AdmurinEnemyAnimation | null>(null);
  const previousAnimationRef = useRef(animation);
  useEffect(() => {
    const outgoing = previousAnimationRef.current;
    previousAnimationRef.current = animation;
    if (outgoing.row === animation.row) return;
    setGhost(outgoing);
    const timer = setTimeout(() => setGhost(null), crossfadeMs);
    return () => clearTimeout(timer);
  }, [animation, crossfadeMs]);
  const ghostPlacement = ghost ? getAdmurinPlacement(sheet, ghost) : null;

  return (
    <div className={cn('admurin-enemy-sprite', className)}>
      {/* Each layer keeps its own pose placement during the dissolve, avoiding an anchor jump. */}
      {ghost && ghostPlacement && (
        <div
          className="admurin-enemy-sprite__cell"
          style={
            {
              width: `${(sheet.cellW / sheet.cellH) * ghostPlacement.zoom * 100}%`,
              height: `${ghostPlacement.zoom * 100}%`,
              transform: `translate(${-ghostPlacement.centerXPercent}%, ${-ghostPlacement.centerYPercent}%)`,
              '--admurin-fade-ms': `${crossfadeMs}ms`,
            } as CSSProperties
          }
        >
          <div key={ghost.row} className="admurin-enemy-sprite__shift admurin-enemy-sprite__shift--fade-out">
            {/* No loop/once class: no animation name, so the ghost holds frame 0 statically. */}
            <div
              className={cn('admurin-enemy-sprite__strip', sheet.pixelated && 'admurin-enemy-sprite__strip--pixelated')}
              style={
                {
                  backgroundImage: `url('${sheet.image}')`,
                  '--admurin-frames': ghost.frames,
                  backgroundSize: getAdmurinBackgroundSize(sheet),
                  backgroundPosition: getAdmurinRowBackgroundPosition(sheet, ghost),
                } as CSSProperties
              }
            />
          </div>
        </div>
      )}
      <div
        className="admurin-enemy-sprite__cell"
        style={
          {
            width: `${(sheet.cellW / sheet.cellH) * placement.zoom * 100}%`,
            height: `${placement.zoom * 100}%`,
            transform: `translate(${-placement.centerXPercent}%, ${-placement.centerYPercent}%)`,
            '--admurin-fade-ms': `${crossfadeMs}ms`,
          } as CSSProperties
        }
      >
        {/* Keyed on the row: remounting re-plays the fade-in, and only a real row switch remounts
            it — same-row replays (playId bumps) restart the strip without blinking the sprite. */}
        <div key={animation.row} className="admurin-enemy-sprite__shift admurin-enemy-sprite__shift--fade-in">
          <div
            key={`${animation.row}-${playId}`}
            className={cn(
              'admurin-enemy-sprite__strip',
              sheet.pixelated && 'admurin-enemy-sprite__strip--pixelated',
              animates && (mode === 'loop' ? 'admurin-enemy-sprite__strip--loop' : 'admurin-enemy-sprite__strip--once'),
            )}
            style={
              {
                backgroundImage: `url('${sheet.image}')`,
                '--admurin-frames': animation.frames,
                backgroundSize: getAdmurinBackgroundSize(sheet),
                backgroundPosition: getAdmurinRowBackgroundPosition(sheet, animation),
                '--admurin-cycle-ms': `${stepCount * animation.frameDurationMs}ms`,
                // Literal, not a custom property: that is what keeps the step on the compositor.
                animationTimingFunction: animates
                  ? getAdmurinAnimationTimingFunctionForSupport(animation, SUPPORTS_ADMURIN_FRAME_SEQUENCE)
                  : undefined,
                animationPlayState: paused ? 'paused' : 'running',
              } as CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
