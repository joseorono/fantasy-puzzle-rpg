import type { CSSProperties } from 'react';
import { getAdmurinAnimationCycleMs, getAdmurinPlacement, getAdmurinSheetRowCount } from '~/lib/admurin-enemy-sheet';
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
  const animates = animation.frames > 1;
  const { zoom, centerXPercent, centerYPercent } = getAdmurinPlacement(sheet, animation);

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
        }}
      >
        <div className="admurin-enemy-sprite__shift" style={{ '--admurin-row': animation.row } as CSSProperties}>
          <div
            key={`${animation.row}-${playId}`}
            className={cn(
              'admurin-enemy-sprite__strip',
              animates && (mode === 'loop' ? 'admurin-enemy-sprite__strip--loop' : 'admurin-enemy-sprite__strip--once'),
            )}
            style={
              {
                backgroundImage: `url('${sheet.image}')`,
                '--admurin-frames': animation.frames,
                '--admurin-rows': getAdmurinSheetRowCount(sheet),
                '--admurin-cycle-ms': `${getAdmurinAnimationCycleMs(animation)}ms`,
                // Literal, not a custom property: that is what keeps the step on the compositor.
                animationTimingFunction: animates ? `steps(${animation.frames}, end)` : undefined,
                animationPlayState: paused ? 'paused' : 'running',
              } as CSSProperties
            }
          />
        </div>
      </div>
    </div>
  );
}
