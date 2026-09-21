import { POISE_BAR_CLASSES } from '~/constants/ui';
import { calculatePercentage } from '~/lib/math';
import { isEnemyStaggered, type EnemyPoiseState } from '~/lib/poise-system';
import { cn } from '~/lib/utils';

interface EnemyPoiseBarProps {
  poise: EnemyPoiseState;
  className?: string;
}

/**
 * Thin, unlabelled posture bar under an enemy's HP bar. Fill = remaining poise; it reads as
 * empty for the whole Break window (the pool refills in state at the Break, but the bar only
 * shows it back once the enemy recovers), and a small tick marks the original max once the
 * pool has escalated past it.
 */
export function EnemyPoiseBar({ poise, className }: EnemyPoiseBarProps) {
  const isBroken = isEnemyStaggered(poise);
  const fillPercentage = isBroken ? 0 : calculatePercentage(poise.current, poise.max);
  const hasEscalated = poise.max > poise.originalMax;
  const originalMaxPercentage = hasEscalated ? calculatePercentage(poise.originalMax, poise.max) : 0;

  return (
    <div
      className={cn(
        'relative h-1 w-full border sm:h-1.5',
        isBroken ? POISE_BAR_CLASSES.broken : POISE_BAR_CLASSES.track,
        className,
      )}
      role="meter"
      aria-label="Poise"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fillPercentage)}
    >
      <div
        className={cn('h-full transition-all duration-300', POISE_BAR_CLASSES.fill)}
        style={{ width: `${fillPercentage}%` }}
      />
      {hasEscalated && (
        <div
          className={cn('pointer-events-none absolute top-0 bottom-0 w-px', POISE_BAR_CLASSES.originalMaxMark)}
          style={{ left: `${originalMaxPercentage}%` }}
        />
      )}
    </div>
  );
}
