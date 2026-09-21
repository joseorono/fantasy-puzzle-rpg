import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import NumberFlow from '@number-flow/react';
import { battleStartedAtAtom, gameStatusAtom, totalDamageDealtAtom } from '~/stores/battle-atoms';
import { ITEM_COOLDOWN_LABEL_TICK_MS } from '~/constants/battle';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';
import type { EnemyPoiseView } from '~/lib/poise-system';
import { cn } from '~/lib/utils';

interface TrainingDummyReadoutProps {
  isBattlePaused: boolean;
  /** The dummy's poise, for tuning Break feel; omitted = row hidden. */
  poise?: EnemyPoiseView;
  className?: string;
}

/** `72%`, `72% ×2` once escalated, or the phase name while the pool is out of play. */
function formatPoise(poise: EnemyPoiseView): string {
  if (poise.phase === 'broken') return 'BROKEN';
  if (poise.phase === 'immune') return 'IMMUNE';
  return `${poise.fillPercent}%${poise.breakCount > 0 ? ` ×${poise.breakCount}` : ''}`;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Takes the HP bar's slot under the training dummy: total damage, DPS, and active time.
 *
 * The clock is local, not battle state: the battle's `startedAt` keeps running through pauses
 * (which would deflate DPS), and an accumulator in the tick atom would force a state write every
 * tick. It starts on the first hit, so the idle seconds before the first move don't count, and
 * only advances while the fight is live and unpaused.
 */
export function TrainingDummyReadout({ isBattlePaused, poise, className }: TrainingDummyReadoutProps) {
  const totalDamage = useAtomValue(totalDamageDealtAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const startedAt = useAtomValue(battleStartedAtAtom);
  const [activeMs, setActiveMs] = useState(0);

  // A new fight (fresh startedAt) starts the clock over.
  useEffect(() => {
    setActiveMs(0);
  }, [startedAt]);

  const isRunning = totalDamage > 0 && gameStatus === 'playing' && !isBattlePaused;
  useEffect(() => {
    if (!isRunning) return;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      setActiveMs((prev) => prev + (now - last));
      last = now;
    }, ITEM_COOLDOWN_LABEL_TICK_MS);
    return () => clearInterval(interval);
  }, [isRunning]);

  const dps = activeMs > 0 ? totalDamage / (activeMs / 1000) : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="pixel-font flex items-center justify-between text-[7px] sm:text-[8px]">
        <span className="text-gray-400">DMG</span>
        <span className="number-flow-container font-bold text-white">
          <NumberFlow
            value={totalDamage}
            format={INTEGER_FORMAT}
            trend={1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
        </span>
      </div>
      <div className="pixel-font flex items-center justify-between text-[7px] sm:text-[8px]">
        <span className="text-gray-400">DPS</span>
        <span className="font-bold text-amber-200">{dps.toFixed(1)}</span>
      </div>
      <div className="pixel-font flex items-center justify-between text-[7px] sm:text-[8px]">
        <span className="text-gray-400">TIME</span>
        <span className="font-bold text-white tabular-nums">{formatClock(activeMs)}</span>
      </div>
      {poise && (
        <div className="pixel-font flex items-center justify-between text-[7px] sm:text-[8px]">
          <span className="text-gray-400">POISE</span>
          <span className="font-bold text-amber-200 tabular-nums">{formatPoise(poise)}</span>
        </div>
      )}
    </div>
  );
}
