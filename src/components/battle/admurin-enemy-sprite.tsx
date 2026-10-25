import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ENEMY_SPRITE_CROSSFADE_MS } from '~/constants/battle';
import {
  getAdmurinAnimationTimingFunction,
  getAdmurinPlacement,
  getAdmurinSheetRowCount,
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
 * `linear()` easings make `frameSequence` possible (Chrome/Edge 113+, Firefox 112+, Safari 17.2+).
 * Where unsupported the sequence is ignored entirely — the row falls back to today's steps().
 */
const SUPPORTS_LINEAR_EASING =
  typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');

/**
 * One Admurin enemy sheet row, stepped in CSS (`admurin-enemy-sprites.css`) by translating the
 * strip, so the frames change on the compositor — the same technique as `StellaBattlerSprite`.
 * The strip is keyed on the row + playId, so a motion change (or a replay) restarts at frame 0.
 *
 * `className` lands on the clipping box: state classes like `enemy-staggered` go there, because
 * their transform would otherwise fight the strip's frame transform.
 */
export function AdmurinEnemySprite({ sheet, animation, mode, playId, paused, className }: AdmurinEnemySpriteProps) {
  const sequence = SUPPORTS_LINEAR_EASING ? animation.frameSequence : undefined;
  const stepCount = sequence?.length || animation.frames;
  const animates = stepCount > 1;
  const { zoom, centerXPercent, centerYPercent } = getAdmurinPlacement(sheet, animation);

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
    const timer = setTimeout(() => setGhost(null), ENEMY_SPRITE_CROSSFADE_MS);
    return () => clearTimeout(timer);
  }, [animation]);

  return (
    <div className={cn('admurin-enemy-sprite', className)}>
      {/* One cell of the sheet at the pose's scale, clipped: the box IS the clip region, so a
          zoomed-out pose can never drag the neighbouring rows of the sheet into view. */}
      <div
        className="admurin-enemy-sprite__cell"
        style={{
          width: `${(sheet.cellW / sheet.cellH) * zoom * 100}%`,
          height: `${zoom * 100}%`,
          transform: `translate(${-centerXPercent}%, ${-centerYPercent}%)`,
          '--admurin-fade-ms': `${ENEMY_SPRITE_CROSSFADE_MS}ms`,
        } as CSSProperties}
      >
        {ghost && (
          <div
            key={ghost.row}
            className="admurin-enemy-sprite__shift admurin-enemy-sprite__shift--fade-out"
            style={{ '--admurin-row': ghost.row } as CSSProperties}
          >
            {/* No loop/once class: no animation name, so the ghost holds frame 0 statically. */}
            <div
              className={cn('admurin-enemy-sprite__strip', sheet.pixelated && 'admurin-enemy-sprite__strip--pixelated')}
              style={
                {
                  backgroundImage: `url('${sheet.image}')`,
                  '--admurin-frames': ghost.frames,
                  '--admurin-rows': getAdmurinSheetRowCount(sheet),
                } as CSSProperties
              }
            />
          </div>
        )}
        {/* Keyed on the row: remounting re-plays the fade-in, and only a real row switch remounts
            it — same-row replays (playId bumps) restart the strip without blinking the sprite. */}
        <div
          key={animation.row}
          className="admurin-enemy-sprite__shift admurin-enemy-sprite__shift--fade-in"
          style={{ '--admurin-row': animation.row } as CSSProperties}
        >
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
                '--admurin-rows': getAdmurinSheetRowCount(sheet),
                '--admurin-cycle-ms': `${stepCount * animation.frameDurationMs}ms`,
                // Literal, not a custom property: that is what keeps the step on the compositor.
                animationTimingFunction: animates
                  ? sequence?.length
                    ? getAdmurinAnimationTimingFunction(animation)
                    : `steps(${animation.frames}, end)`
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
