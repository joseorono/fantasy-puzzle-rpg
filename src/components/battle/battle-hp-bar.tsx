import NumberFlow from '@number-flow/react';
import { SNAPPY_SPIN_TIMING, SNAPPY_TRANSFORM_TIMING, SNAPPY_OPACITY_TIMING } from '~/constants/number-flow';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { cn } from '~/lib/utils';

interface BattleHpBarProps {
  currentHp: number;
  maxHp: number;
  className?: string;
}

/**
 * Reusable HP bar with "HP" label, animated "current / max" numbers, and a
 * color-coded progress bar. Used for both party characters and enemies.
 */
export function BattleHpBar({ currentHp, maxHp, className }: BattleHpBarProps) {
  const healthPercentage = calculatePercentage(currentHp, maxHp);
  const hpThreshold = getHpThreshold(healthPercentage);

  // Map thresholds to our new high-contrast colors
  const fillClass = hpThreshold === 'high' ? 'hp-fill-high' : 
                   hpThreshold === 'medium' ? 'hp-fill-medium' : 
                   'hp-fill-low';

  return (
    <div className={cn('w-full', className)}>
      <div className="battle-hp-bar-container">
        <div className="battle-hp-bar-bg" />
        
        <div className="battle-hp-bar-fill-wrapper">
          <div
            className={cn('battle-hp-bar-fill', fillClass)}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>

        <div className="battle-hp-bar-text-overlay">
          <span className="battle-hp-bar-label">HP</span>
          <span className="battle-hp-bar-values">
            <NumberFlow
              value={currentHp}
              spinTiming={SNAPPY_SPIN_TIMING}
              transformTiming={SNAPPY_TRANSFORM_TIMING}
              opacityTiming={SNAPPY_OPACITY_TIMING}
            />
            /
            <NumberFlow
              value={maxHp}
              spinTiming={SNAPPY_SPIN_TIMING}
              transformTiming={SNAPPY_TRANSFORM_TIMING}
              opacityTiming={SNAPPY_OPACITY_TIMING}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
