import { ORB_TYPE_CLASSES, WEAKNESS_SOURCE_LABELS } from '~/constants/ui';
import { cn } from '~/lib/utils';
import type { WeaknessSource } from '~/types/rpg-elements';

interface EnemyWeaknessBadgesProps {
  weakTo: WeaknessSource[];
  className?: string;
}

/** What an enemy is weak to, under its name: an orb dot per colour, an "ULT" chip for Ultimates. */
export function EnemyWeaknessBadges({ weakTo, className }: EnemyWeaknessBadgesProps) {
  return (
    <div className={cn('enemy-weakness-badges', className)}>
      <span className="enemy-weakness-badges__label pixel-font">Weak</span>
      {weakTo.map((source) =>
        source === 'ultimate' ? (
          <span
            key={source}
            title={WEAKNESS_SOURCE_LABELS[source]}
            aria-label={WEAKNESS_SOURCE_LABELS[source]}
            className="enemy-weakness-badges__ult pixel-font"
          >
            ULT
          </span>
        ) : (
          <span
            key={source}
            title={WEAKNESS_SOURCE_LABELS[source]}
            aria-label={WEAKNESS_SOURCE_LABELS[source]}
            className={cn('enemy-weakness-badges__orb', ORB_TYPE_CLASSES[source])}
          />
        ),
      )}
    </div>
  );
}
