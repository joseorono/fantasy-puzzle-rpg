import { useAtomValue, useSetAtom } from 'jotai';
import { EnemyDisplay } from '~/components/battle/enemy-display';
import { PartyDisplay } from '~/components/battle/party-display';
import { Match3Board } from '~/components/battle/match3-board';
import { GameOverModal } from '~/components/battle/game-over-modal';
import { BattleItemBar } from '~/components/battle/battle-item-bar';
import { DamageNumber } from '~/components/battle/damage-number';
import { battleStateAtom, resetBattleAtom, damagePartyAtom, gameStatusAtom, enemyAtom, tickSkillCooldownsAtom } from '~/stores/battle-atoms';
import { SkillActivationEffect } from '~/components/battle/skill-activation-effect';
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
  const tickSkillCooldowns = useSetAtom(tickSkillCooldownsAtom);
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
      setNextAttackIn((prev) => {
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

  // Skill cooldown tick loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tickSkillCooldowns(0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, tickSkillCooldowns]);

  return (
    <div className="game-view overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Retro screen effect overlay */}
      <div className="retro-screen pointer-events-none fixed inset-0 z-50" />

      {/* Main container - constrained to game view height */}
      <div className="relative flex h-full flex-col">
        {/* Header */}
        <header className="relative z-10 border-b-2 border-gray-700 bg-gradient-to-b from-gray-900/90 to-gray-900/70 px-2 py-1.5 sm:px-3 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="pixel-font-alt text-base font-bold text-white sm:text-lg md:text-xl">⚔️ BATTLE</h1>
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
                onClick={() => resetBattle()}
                className="h-7 w-7 bg-gray-800 hover:bg-gray-700 sm:h-8 sm:w-8"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main battle area - Split view */}
        <div className="battleContainer">
          <div className="battleArea">
            {/* Left/Top section - Enemy */}
            <div className="enemySection relative border-b-4 border-gray-700 lg:border-r-4 lg:border-b-0">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-green-900/10 to-emerald-950/30" />
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 h-64 w-64 animate-pulse rounded-full bg-green-500 blur-3xl" />
                <div className="absolute right-0 bottom-0 h-96 w-96 animate-pulse rounded-full bg-emerald-600 blur-3xl delay-1000" />
              </div>

              <EnemyDisplay />
              <DamageNumber target="enemy" />
            </div>

            {/* Right/Bottom section - Party */}
            <div className="partySection relative">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-900/10 to-purple-900/20" />
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 h-64 w-64 animate-pulse rounded-full bg-blue-500 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-96 w-96 animate-pulse rounded-full bg-purple-600 blur-3xl delay-1000" />
              </div>

              <PartyDisplay />
              <DamageNumber target="party" />
              <SkillActivationEffect />
            </div>
          </div>

          {/* Bottom section - Match-3 Board */}
          <div className="boardSection relative border-t-2 border-amber-700 bg-gradient-to-b from-amber-950/80 to-amber-900/60 p-2 sm:p-3">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="pixel-art absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3NtYWxsR3JpZCkiLz48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            </div>

            <div id="match3BoardContainer" className="relative mx-auto max-w-xl">
              <Match3Board />
              <BattleItemBar />
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 animate-pulse rounded-full bg-white opacity-30"
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
