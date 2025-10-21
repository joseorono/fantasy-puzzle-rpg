import { useAtomValue, useSetAtom } from 'jotai';
import { EnemyDisplay } from '~/components/battle/enemy-display';
import { PartyDisplay } from '~/components/battle/party-display';
import { Match3Board } from '~/components/battle/match3-board';
import { GameOverModal } from '~/components/battle/game-over-modal';
import { DamageNumber } from '~/components/battle/damage-number';
import { battleStateAtom, resetBattleAtom, damagePartyAtom, gameStatusAtom, enemyAtom } from '~/stores/battle-atoms';
import { Button } from '~/components/ui/8bit/button';
import { RotateCcw, Volume2, VolumeX, Swords } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { calculateEnemyAttackInterval, calculateEnemyDamage } from '~/lib/rpg-calculations';

export default function BattleScreen() {
  const battleState = useAtomValue(battleStateAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemy = useAtomValue(enemyAtom);
  const resetBattle = useSetAtom(resetBattleAtom);
  const damageParty = useSetAtom(damagePartyAtom);
  const [isMuted, setIsMuted] = useState(false);

  // Calculate actual attack interval with SPD modifier
  const actualAttackInterval = calculateEnemyAttackInterval(enemy);
  const attackIntervalSeconds = actualAttackInterval / 1000;

  // Calculate actual damage with POW modifier
  const actualDamage = calculateEnemyDamage(enemy);

  const [nextAttackIn, setNextAttackIn] = useState(attackIntervalSeconds);
  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Enemy attack timer
  useEffect(() => {
    if (gameStatus !== 'playing') {
      // Clear timers when game is over
      if (attackTimerRef.current) clearInterval(attackTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Reset countdown
    setNextAttackIn(attackIntervalSeconds);

    // Countdown timer (updates every second)
    countdownRef.current = setInterval(() => {
      setNextAttackIn(prev => {
        if (prev <= 1) return attackIntervalSeconds;
        return prev - 1;
      });
    }, 1000);

    // Attack timer
    attackTimerRef.current = setInterval(() => {
      damageParty(actualDamage);
    }, actualAttackInterval);

    return () => {
      if (attackTimerRef.current) clearInterval(attackTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [gameStatus, actualAttackInterval, actualDamage, damageParty, attackIntervalSeconds]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden flex items-center justify-center p-2 sm:p-4">
      {/* Retro screen effect overlay */}
      <div className="retro-screen fixed inset-0 pointer-events-none z-50" />

      {/* Main container - constrained max size */}
      <div className="w-full max-w-7xl max-h-[95vh] flex sm:gap-0 flex-col bg-slate-900/50 rounded-lg overflow-hidden">
        {/* Header */}
        <header className="relative z-10 bg-gradient-to-b from-gray-900/90 to-gray-900/70 border-b-2 border-gray-700 px-2 sm:px-3 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white pixel-font-alt">
                ⚔️ BATTLE
              </h1>
              <div className="hidden sm:flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-700">
                <span className="text-gray-400 text-xs pixel-font">TURN:</span>
                <span className="text-white font-bold text-xs pixel-font">{battleState.turn}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-700">
                <span className="text-gray-400 text-xs pixel-font">SCORE:</span>
                <span className="text-yellow-400 font-bold text-xs pixel-font">{battleState.score}</span>
              </div>
              <div className="flex items-center gap-1 bg-red-900 px-2 py-1 rounded border border-red-700 animate-pulse">
                <Swords className="w-3 h-3 text-red-300" />
                <span className="text-red-200 text-xs pixel-font">ATK:</span>
                <span className="text-white font-bold text-xs pixel-font">{nextAttackIn}s</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                className="bg-gray-800 hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8"
              >
                {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => resetBattle()}
                className="bg-gray-800 hover:bg-gray-700 h-7 w-7 sm:h-8 sm:w-8"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main battle area - Split view */}
        <div className="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 gap-0 min-h-0">
          {/* Left/Top section - Enemy */}
          <div className="relative border-b-4 lg:border-b-0 lg:border-r-4 border-gray-700 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-green-900/10 to-emerald-950/30" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-green-500 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <EnemyDisplay />
            <DamageNumber target="enemy" />
          </div>

          {/* Right/Bottom section - Party */}
          <div className="relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-900/10 to-purple-900/20" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <PartyDisplay />
            <DamageNumber target="party" />
          </div>
        </div>

        {/* Bottom section - Match-3 Board */}
        <div className="relative bg-gradient-to-b from-amber-950/80 to-amber-900/60 border-t-2 border-amber-700 p-2 sm:p-3">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3NtYWxsR3JpZCkiLz48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pixel-art" />
          </div>

          <div className="relative max-w-xl mx-auto">
            <Match3Board />
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Game Over Modal */}
      <GameOverModal />
    </div>
  );
}
