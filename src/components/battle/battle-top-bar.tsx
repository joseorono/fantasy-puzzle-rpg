import { useAtomValue, useSetAtom } from 'jotai';
import { Swords, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/8bit/button';
import { battleStateAtom, resetBattleAtom } from '~/stores/battle-atoms';

interface BattleTopBarProps {
  nextAttackIn: number;
}

export function BattleTopBar({ nextAttackIn }: BattleTopBarProps) {
  const battleState = useAtomValue(battleStateAtom);
  const resetBattle = useSetAtom(resetBattleAtom);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <header
      id="battle-top-bar"
      className="relative z-10 border-b-2 border-gray-700 bg-gradient-to-b from-gray-900/90 to-gray-900/70 px-2 py-1.5 sm:px-3 sm:py-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h1 className="pixel-font-alt text-base font-bold text-white sm:text-lg md:text-xl">BATTLE</h1>
          <div className="hidden items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 sm:flex">
            <span className="pixel-font text-xs text-gray-400">TURN:</span>
            <span className="pixel-font text-xs font-bold text-white">{battleState.turn}</span>
          </div>
          <div className="hidden items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 sm:flex">
            <span className="pixel-font text-xs text-gray-400">SCORE:</span>
            <span className="pixel-font text-xs font-bold text-yellow-400">{battleState.score}</span>
          </div>
          <div className="flex animate-pulse items-center gap-1 rounded border border-red-700 bg-red-900 px-2 py-1">
            <Swords className="h-3 w-3 text-red-300" />
            <span className="pixel-font text-xs text-red-200">ATK:</span>
            <span className="pixel-font text-xs font-bold text-white">{nextAttackIn}s</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 w-7 bg-gray-800 hover:bg-gray-700 sm:h-8 sm:w-8"
          >
            {isMuted ? (
              <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={resetBattle}
            className="h-7 w-7 bg-gray-800 hover:bg-gray-700 sm:h-8 sm:w-8"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
