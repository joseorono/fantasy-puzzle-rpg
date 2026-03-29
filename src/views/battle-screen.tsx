import { useAtomValue, useSetAtom } from 'jotai';
import { EnemyDisplay } from '~/components/battle/enemy-display';
import { PartyDisplay } from '~/components/battle/party-display';
import { Match3Board } from '~/components/battle/match3-board';
import { BattleOverModal } from '~/components/battle/battle-over-modal';
import { BattleItemBar } from '~/components/battle/battle-item-bar';
import { DamageNumber } from '~/components/battle/damage-number';
import {
  damagePartyAtom,
  gameStatusAtom,
  enemiesAtom,
  tickSkillCooldownsAtom,
} from '~/stores/battle-atoms';
import { SkillActivationEffect } from '~/components/battle/skill-activation-effect';
import { SkillBurstOverlay } from '~/components/battle/skill-burst-overlay';
import { useState, useEffect, useRef } from 'react';
import { calculateEnemyAttackInterval, calculateEnemyDamage } from '~/lib/rpg-calculations';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { BattleTopBar } from '~/components/battle/battle-top-bar';

export default function BattleScreen() {
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemies = useAtomValue(enemiesAtom);
  const damageParty = useSetAtom(damagePartyAtom);
  const tickSkillCooldowns = useSetAtom(tickSkillCooldownsAtom);

  // Per-enemy attack timer tracking
  const attackTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [nextAttackIn, setNextAttackIn] = useState(0);
  const countdownTimersRef = useRef<Map<string, number>>(new Map());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all enemy attack timers
  function clearAllTimers() {
    for (const timer of attackTimersRef.current.values()) {
      clearInterval(timer);
    }
    attackTimersRef.current.clear();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    countdownTimersRef.current.clear();
  }

  // Per-enemy attack timers
  useEffect(() => {
    if (gameStatus !== 'playing') {
      clearAllTimers();
      return;
    }

    // Clear existing timers before setting new ones
    clearAllTimers();

    const livingEnemies = enemies.filter((e) => e.currentHp > 0);

    for (const enemy of livingEnemies) {
      const interval = calculateEnemyAttackInterval(enemy);
      const damage = calculateEnemyDamage(enemy);

      // Initialize countdown
      countdownTimersRef.current.set(enemy.id, interval / 1000);

      // Set attack interval per enemy
      const timer = setInterval(() => {
        damageParty(damage, enemy.id);
        countdownTimersRef.current.set(enemy.id, interval / 1000);
      }, interval);

      attackTimersRef.current.set(enemy.id, timer);
    }

    // Shared countdown tick — find soonest attack
    countdownIntervalRef.current = setInterval(() => {
      let minCountdown = Infinity;
      for (const [id, remaining] of countdownTimersRef.current) {
        const next = remaining - 1;
        const enemy = enemies.find((e) => e.id === id);
        if (enemy && enemy.currentHp > 0) {
          const interval = calculateEnemyAttackInterval(enemy) / 1000;
          countdownTimersRef.current.set(id, next <= 0 ? interval : next);
          if (next < minCountdown && next > 0) minCountdown = next;
        }
      }
      setNextAttackIn(minCountdown === Infinity ? 0 : Math.max(1, Math.ceil(minCountdown)));
    }, 1000);

    // Initialize display
    const minInterval = Math.min(...livingEnemies.map((e) => calculateEnemyAttackInterval(e)));
    setNextAttackIn(Math.ceil(minInterval / 1000));

    return () => clearAllTimers();
  }, [gameStatus, enemies, damageParty]);

  // Skill cooldown tick loop
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      tickSkillCooldowns(0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, tickSkillCooldowns]);

  // Combat music
  useEffect(() => {
    soundService.startMusic(SoundNames.combatMusic, 0.5);
    return () => {
      soundService.stopMusic(SoundNames.combatMusic);
    };
  }, []);

  return (
    <div className="game-view overflow-hidden">
      {/* Retro screen effect overlay */}
      <div className="retro-screen pointer-events-none fixed inset-0 z-50" />

      {/* Main container - constrained to game view height */}
      <div className="relative flex h-full flex-col">
        <BattleTopBar nextAttackIn={nextAttackIn} />

        {/* Main battle area - Split view */}
        <div className="battleContainer">
          <div className="battleArea">
            

            {/* Right/Bottom section - Party */}
            <div
              className="partySection relative"
              style={{
                backgroundImage: 'url(/assets/bg/battle/simple_battle_background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <PartyDisplay />
              <DamageNumber target="party" />
              <SkillActivationEffect />
            </div>
            {/* Left/Top section - Enemy */}
            <div
              className="enemySection relative border-b-4 border-gray-700"
              style={{
                backgroundImage: 'url(/assets/bg/battle/simple_battle_background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <EnemyDisplay />
            </div>
          </div>

          {/* Bottom section - Match-3 Board */}
          <div
            id="boardSection"
            className="boardSection relative border-t-2 border-amber-700 bg-gradient-to-b from-amber-950/80 to-amber-900/60 p-2 sm:p-3"
          >
            {/* Decorative background pattern */}
            <div className="board-pattern-layer absolute inset-0 opacity-5">
              <div className="pixel-art absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3NtYWxsR3JpZCkiLz48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            </div>

            <div className="relative z-1 flex flex-col items-center">
              <div id="boardWrapper" className="relative mx-auto max-w-xl">
                <Match3Board />
              </div>
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

      {/* Ace Attorney-style skill burst overlay */}
      <SkillBurstOverlay />

      {/* Game Over Modal */}
      <BattleOverModal />
    </div>
  );
}
