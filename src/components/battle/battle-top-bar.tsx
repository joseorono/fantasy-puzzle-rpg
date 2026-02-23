import { useAtomValue, useSetAtom } from 'jotai';
import { Swords, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { battleStateAtom, resetBattleAtom } from '~/stores/battle-atoms';

interface BattleTopBarProps {
  nextAttackIn: number;
}

export function BattleTopBar({ nextAttackIn }: BattleTopBarProps) {
  const battleState = useAtomValue(battleStateAtom);
  const resetBattle = useSetAtom(resetBattleAtom);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <header id="battle-top-bar">
      <div className="btb-inner">
        <div className="btb-stats">
          <h1 className="btb-title pixel-font-alt">BATTLE</h1>

          <div className="btb-badge">
            <span className="btb-badge-label pixel-font">TURN:</span>
            <span className="btb-badge-value pixel-font">{battleState.turn}</span>
          </div>

          <div className="btb-badge">
            <span className="btb-badge-label pixel-font">SCORE:</span>
            <span className="btb-badge-value btb-badge-value--gold pixel-font">{battleState.score}</span>
          </div>

          <div className="btb-atk-badge">
            <Swords className="btb-atk-icon" />
            <span className="btb-atk-label pixel-font">ATK:</span>
            <span className="btb-atk-value pixel-font">{nextAttackIn}s</span>
          </div>
        </div>

        <div className="btb-actions">
          <button className="btb-btn" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="btb-btn-icon" /> : <Volume2 className="btb-btn-icon" />}
          </button>
          <button className="btb-btn" onClick={resetBattle}>
            <RotateCcw className="btb-btn-icon" />
          </button>
        </div>
      </div>
    </header>
  );
}
