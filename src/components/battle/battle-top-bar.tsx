import { useAtomValue } from 'jotai';
import { Eye, Hourglass, Star, Swords } from 'lucide-react';
import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { turnAtom, scoreAtom, gameStatusAtom } from '~/stores/battle-atoms';
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
  isBattlePaused: boolean;
  onPauseToggle: () => void;
}

export function BattleTopBar({ enemyTimers, isBattlePaused, onPauseToggle }: BattleTopBarProps) {
  const turn = useAtomValue(turnAtom);
  const score = useAtomValue(scoreAtom);
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

  const isPaused = gameStatus !== 'playing' || isBattlePaused === true;
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
                  durationMs={timer.durationMs}
                  cycleKey={timer.cycleKey}
                  paused={isPaused}
                  size="sm"
                  tone={timer.isStandby ? 'gold' : 'danger'}
                  className="btb-threat-pie"
                >
                  {timer.isStandby ? (
                    <Eye className="btb-threat-icon" />
                  ) : (
                    <Swords className="btb-threat-icon" />
                  )}
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
            <span className="btb-badge-value pixel-font">{turn}</span>
          </div>

          <div className="btb-badge">
            <Star className="btb-badge-icon" aria-label="Score" />
            <span className="btb-badge-value btb-badge-value--gold pixel-font number-flow-container">
              <NumberFlow
                value={score}
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
            onClick={onPauseToggle}
            aria-label={isBattlePaused ? 'Despausar batalla' : 'Pausar batalla'}
          >
            <img
              className="btb-btn-icon btb-btn-icon--img"
              src="/assets/icons/indigolay/icon-columns.png"
              alt=""
              draggable={false}
            />
          </button>
          <button
            className="btb-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <img
              className="btb-btn-icon btb-btn-icon--img"
              src={isMuted ? '/assets/icons/indigolay/icon-mute.png' : '/assets/icons/indigolay/icon-unmute.png'}
              alt=""
              draggable={false}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
