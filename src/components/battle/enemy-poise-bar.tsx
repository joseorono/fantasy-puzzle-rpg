import { POISE_BAR_CLASSES } from '~/constants/ui';
import type { EnemyPoiseView } from '~/lib/poise-system';
import { cn } from '~/lib/utils';

interface EnemyPoiseBarProps {
  view: EnemyPoiseView;
  /** The enemy is still observing: poise damage does not apply yet, so the bar is dimmed. */
  isStandby?: boolean;
  className?: string;
}

/** One-line explanation of the current phase, surfaced as a hover title (no space for a label). */
function describePhase(view: EnemyPoiseView, isStandby: boolean): string {
  if (isStandby) return 'Poise — counts once this enemy starts attacking';
  switch (view.phase) {
    case 'broken':
      return 'Staggered! Bonus damage while the bar drains';
    case 'immune':
      return 'Recovering — poise damage is ignored while the bar rebuilds';
    default:
      return `Poise ${view.fillPercent}% — empty it to stagger this enemy`;
  }
}

/**
 * Thin, unlabelled posture bar under an enemy's HP bar. It tells the Break story in three phases:
 * **ready** — amber fill is the poise left before a Break; **broken** — a pale fill drains over
 * the vulnerable window, so the player can see how long the bonus damage lasts right under the
 * target; **immune** — a muted fill rebuilds over the immunity window, so hits that do not dent it
 * read as "not yet" instead of "not working". A tick marks the original max once escalated.
 */
export function EnemyPoiseBar({ view, isStandby = false, className }: EnemyPoiseBarProps) {
  const isBroken = view.phase === 'broken';
  const isImmune = view.phase === 'immune';
  const widthPercent = isBroken ? view.windowPercent : isImmune ? 100 - view.windowPercent : view.fillPercent;
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
      aria-valuenow={isBroken ? 0 : view.fillPercent}
      title={describePhase(view, isStandby)}
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
      {view.originalMaxPercent !== null && !isBroken && (
        <div
          className={cn('pointer-events-none absolute top-0 bottom-0 w-px', POISE_BAR_CLASSES.originalMaxMark)}
          style={{ left: `${view.originalMaxPercent}%` }}
        />
      )}
    </div>
  );
}
