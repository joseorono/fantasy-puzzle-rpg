import { useAtomValue } from 'jotai';
import { Hourglass, Star, Swords, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { battleStateAtom, gameStatusAtom } from '~/stores/battle-atoms';
import { RadialCountdown } from '~/components/ui-custom/radial-countdown';
import { soundService } from '~/services/sound-service';
import {
  INTEGER_FORMAT,
  SNAPPY_OPACITY_TIMING,
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
} from '~/constants/number-flow';
import type { EnemyAttackTimer } from '~/hooks/use-enemy-attack-timers';

/** Beyond this, extra enemy timers collapse into a "+N" chip to avoid crowding. */
const MAX_VISIBLE_TIMERS = 4;

interface BattleTopBarProps {
  /** Per-enemy attack timing, from `useEnemyAttackTimers`. */
  enemyTimers: EnemyAttackTimer[];
}

export function BattleTopBar({ enemyTimers }: BattleTopBarProps) {
  const battleState = useAtomValue(battleStateAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const [isMuted, setIsMuted] = useState(() => soundService.isMuted());

  function toggleMute() {
    if (isMuted) {
      soundService.unmuteAll();
    } else {
      soundService.muteAll();
    }
    setIsMuted(!isMuted);
  }

  const isPaused = gameStatus !== 'playing';
  const visibleTimers = enemyTimers.slice(0, MAX_VISIBLE_TIMERS);
  const overflowCount = enemyTimers.length - visibleTimers.length;

  return (
    <header id="battle-top-bar">
      <div className="btb-inner">
        {/* Incoming enemy attacks — one depleting ring per living enemy. */}
        <div className="btb-threats">
          <span className="btb-threats-label pixel-font">INCOMING</span>
          <div className="btb-threats-pies">
            {visibleTimers.length === 0 ? (
              <span className="btb-threats-clear pixel-font">CLEAR</span>
            ) : (
              visibleTimers.map((timer) => (
                <RadialCountdown
                  key={timer.id}
                  durationMs={timer.intervalMs}
                  cycleKey={timer.cycleKey}
                  paused={isPaused}
                  size="md"
                  tone="danger"
                  className="btb-threat-pie"
                >
                  <Swords className="btb-threat-icon" />
                </RadialCountdown>
              ))
            )}
            {overflowCount > 0 && <span className="btb-threats-more pixel-font">+{overflowCount}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="btb-stats">
          <div className="btb-badge">
            <Hourglass className="btb-badge-icon" aria-label="Turn" />
            <span className="btb-badge-value pixel-font">{battleState.turn}</span>
          </div>

          <div className="btb-badge">
            <Star className="btb-badge-icon" aria-label="Score" />
            <span className="btb-badge-value btb-badge-value--gold pixel-font number-flow-container">
              <NumberFlow
                value={battleState.score}
                format={INTEGER_FORMAT}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="btb-actions">
          <button
            className="btb-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="btb-btn-icon" /> : <Volume2 className="btb-btn-icon" />}
          </button>
        </div>
      </div>
    </header>
  );
}
