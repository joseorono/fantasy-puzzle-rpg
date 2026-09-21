import { POISE_BAR_CLASSES } from '~/constants/ui';
import { describeEnemyPoise } from '~/lib/poise-system';
import { cn } from '~/lib/utils';
import type { EnemyPoiseSummary } from '~/types/battle';

interface EnemyPoiseBarProps {
  poise: EnemyPoiseSummary;
  /** The enemy is still observing: poise damage does not apply yet, so the bar is dimmed. */
  isStandby?: boolean;
  className?: string;
}

/**
 * Thin, unlabelled posture bar under an enemy's HP bar. It tells the Break story in three phases:
 * **ready** — amber fill is the poise left before a Break; **broken** — a pale fill drains over
 * the vulnerable window, so the player can see how long the bonus damage lasts right under the
 * target; **immune** — a muted fill rebuilds over the immunity window, so hits that do not dent it
 * read as "not yet" instead of "not working". A tick marks the original max once escalated.
 */
export function EnemyPoiseBar({ poise, isStandby = false, className }: EnemyPoiseBarProps) {
  const isBroken = poise.phase === 'broken';
  const isImmune = poise.phase === 'immune';
  const widthPercent = isBroken ? poise.windowPercent : isImmune ? 100 - poise.windowPercent : poise.fillPercent;
  const fillClass = isBroken
    ? POISE_BAR_CLASSES.brokenWindow
    : isImmune
      ? POISE_BAR_CLASSES.immune
      : POISE_BAR_CLASSES.fill;

  return (
    <div
      className={cn(
        'relative h-1 w-full border sm:h-1.5',
        isBroken ? POISE_BAR_CLASSES.broken : POISE_BAR_CLASSES.track,
        isStandby && POISE_BAR_CLASSES.standby,
        className,
      )}
      role="meter"
      aria-label="Poise"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isBroken ? 0 : poise.fillPercent}
      title={describeEnemyPoise(poise, isStandby)}
    >
      {/* The window phases move every battle tick; a short linear transition smooths the steps. */}
      <div
        className={cn(
          'h-full transition-[width] ease-linear',
          isBroken || isImmune ? 'duration-100' : 'duration-300',
          fillClass,
        )}
        style={{ width: `${widthPercent}%` }}
      />
      {poise.originalMaxPercent !== null && !isBroken && (
        <div
          className={cn('pointer-events-none absolute top-0 bottom-0 w-px', POISE_BAR_CLASSES.originalMaxMark)}
          style={{ left: `${poise.originalMaxPercent}%` }}
        />
      )}
    </div>
  );
}
