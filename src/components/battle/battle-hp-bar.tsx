import NumberFlow from '@number-flow/react';
import { SNAPPY_SPIN_TIMING, SNAPPY_TRANSFORM_TIMING, SNAPPY_OPACITY_TIMING } from '~/constants/number-flow';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import type { HpThreshold } from '~/lib/rpg-calculations';
import { cn } from '~/lib/utils';

interface BattleHpBarProps {
  currentHp: number;
  maxHp: number;
  thresholdColors: Record<HpThreshold, string>;
  className?: string;
}

/**
 * Reusable HP bar with "HP" label, animated "current / max" numbers, and a
 * color-coded progress bar. Used for both party characters and enemies.
 */
export function BattleHpBar({ currentHp, maxHp, thresholdColors, className }: BattleHpBarProps) {
  const healthPercentage = calculatePercentage(currentHp, maxHp);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="pixel-font text-[7px] text-gray-400 sm:text-[8px]">HP</span>
        <span className="pixel-font text-[7px] font-bold text-white sm:text-[8px]">
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
      <div className="relative h-1.5 rounded-none border border-gray-700 bg-gray-800 sm:h-2">
        <div
          className={cn(
            'h-full transition-all duration-300',
            thresholdColors[getHpThreshold(healthPercentage)],
          )}
          style={{ width: `${healthPercentage}%` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        />
      </div>
    </div>
  );
}
