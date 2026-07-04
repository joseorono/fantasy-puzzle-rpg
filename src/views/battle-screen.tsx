import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useLayoutEffect, useState } from 'react';
import { EnemyDisplay } from '~/components/battle/enemy-display';
import { BattlePauseOverlay } from '~/components/battle/battle-pause-overlay';
import { PartyDisplay } from '~/components/battle/party-display';
import { Match3Board } from '~/components/battle/match3-board';
import { BattleOverModal } from '~/components/battle/battle-over-modal';
import { BattleItemBar } from '~/components/battle/battle-item-bar';
import { DamageNumber } from '~/components/battle/damage-number';
import {
  gameStatusAtom,
  tickSkillCooldownsAtom,
  tickGuardDecayAtom,
  ensureFreshBattleAtom,
} from '~/stores/battle-atoms';
import { useParty, useViewData } from '~/stores/game-store';
import { SkillActivationEffect } from '~/components/battle/skill-activation-effect';
import { SkillBurstOverlay } from '~/components/battle/skill-burst-overlay';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { KeyboardKeys } from '~/constants/keyboard';
import { BattleTopBar } from '~/components/battle/battle-top-bar';
import { useEnemyAttackTimers } from '~/hooks/use-enemy-attack-timers';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';

export default function BattleScreen() {
  const gameStatus = useAtomValue(gameStatusAtom);
  const tickSkillCooldowns = useSetAtom(tickSkillCooldownsAtom);
  const tickGuardDecay = useSetAtom(tickGuardDecayAtom);
  const party = useParty();
  const ensureFreshBattle = useSetAtom(ensureFreshBattleAtom);
  const [isBattlePaused, setIsBattlePaused] = useState(false);

  // Background can be overridden per-encounter (e.g. dungeon/floor art) via view data.
  const battleData = useViewData('battle-demo');
  const bgImage = battleData?.bgImage ?? '/assets/bg/battle/simple_battle_background.jpg';

  function toggleBattlePause() {
    if (gameStatus !== 'playing' && isBattlePaused !== true) return;
    setIsBattlePaused((prev) => prev !== true);
  }

  function resumeBattle() {
    setIsBattlePaused(false);
  }

  // On entering the battle view onto an already-finished fight, re-arm a fresh battle
  // (enemies back to full HP) so re-entry always restarts. Runs before paint to avoid a
  // one-frame flash of the victory/defeat modal. Mount-only: capture the party as it is on entry.
  useLayoutEffect(() => {
    ensureFreshBattle(party);
    setIsBattlePaused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useWindowKeyDown((event) => {
    if (event.key !== KeyboardKeys.Escape) return;
    if (gameStatus !== 'playing' && isBattlePaused !== true) return;

    event.preventDefault();
    toggleBattlePause();
  });

  useEffect(() => {
    if (gameStatus === 'playing') return;
    setIsBattlePaused(false);
  }, [gameStatus]);

  // Drives enemy attacks and exposes per-enemy countdown timing for the top bar.
  const enemyTimers = useEnemyAttackTimers(isBattlePaused);

  // Skill cooldown + Guard decay tick loop
  useEffect(() => {
    if (gameStatus !== 'playing' || isBattlePaused === true) return;

    const interval = setInterval(() => {
      tickSkillCooldowns(0.1);
      tickGuardDecay(0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, isBattlePaused, tickSkillCooldowns, tickGuardDecay]);

  // Combat music
  useEffect(() => {
    soundService.startMusic(SoundNames.combatMusic, 0.5);
    return () => {
      soundService.stopMusic(SoundNames.combatMusic);
    };
  }, []);

  return (
    <div className="game-view flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto">
      {/* Retro screen effect overlay */}
      <div className="retro-screen pointer-events-none fixed inset-0 z-50" />

      {/* Main container - constrained to game view height */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <BattleTopBar enemyTimers={enemyTimers} isBattlePaused={isBattlePaused} onPauseToggle={toggleBattlePause} />

        {/* Main battle area - Split view */}
        <div className="battleContainer">
          <div className="battleArea">
            

            {/* Right/Bottom section - Party */}
            <div
              className="partySection relative"
              style={{
                backgroundImage: `url(${bgImage})`,
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
                backgroundImage: `url(${bgImage})`,
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
            className="boardSection relative border-t-2 border-amber-700 bg-gradient-to-b from-amber-950/80 to-amber-900/60 p-2 sm:p-3 md:p-4"
            style={{ '--board-bg-image': `url(${bgImage})` } as React.CSSProperties}
          >
            {/* Decorative background pattern */}
            <div className="board-pattern-layer absolute inset-0 opacity-5">
              <div className="pixel-art absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDEwIDAgTCAwIDAgMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI3NtYWxsR3JpZCkiLz48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
            </div>

            <div className="relative z-1 flex flex-col items-center xl:-translate-y-8 sm:p-3 md:p-4">
              <div id="boardWrapper" className="relative mx-auto max-w-xl">
                <Match3Board isBattlePaused={isBattlePaused} />
              </div>
              <BattleItemBar isBattlePaused={isBattlePaused} />
            </div>
          </div>
        </div>

        {isBattlePaused === true && <BattlePauseOverlay onResume={resumeBattle} />}
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
