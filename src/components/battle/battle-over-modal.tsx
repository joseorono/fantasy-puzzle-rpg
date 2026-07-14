import { useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  gameStatusAtom,
  enemiesAtom,
  partyAtom,
  resetBattleAtom,
  scoreAtom,
  maxComboAtom,
  itemsUsedAtom,
  battleStartedAtAtom,
} from '~/stores/battle-atoms';
import { BattleRatingScreen } from '~/components/battle/battle-rating-screen';
import { computeBattleRating, type BattleRatingResult } from '~/lib/battle-rating';
import { VICTORY_FLAVOR_BY_STARS } from '~/constants/battle-rating';
import { resetDungeonRunAtom } from '~/stores/dungeon-atoms';
import { useRouterActions, usePartyActions } from '~/stores/game-store';
import { isGameStartedAtom } from '~/stores/app-atoms';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { combineLootFromEnemies } from '~/lib/loot';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { RetroDivider } from '~/components/ui-custom/retro-divider';
import { SparkleLayer } from '~/components/effects/sparkle-layer';

export function BattleOverModal() {
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemies = useAtomValue(enemiesAtom);
  const battleParty = useAtomValue(partyAtom);
  const score = useAtomValue(scoreAtom);
  const maxCombo = useAtomValue(maxComboAtom);
  const itemsUsed = useAtomValue(itemsUsedAtom);
  const startedAt = useAtomValue(battleStartedAtAtom);
  const resetBattle = useSetAtom(resetBattleAtom);
  const resetDungeonRun = useSetAtom(resetDungeonRunAtom);
  const setGameStarted = useSetAtom(isGameStartedAtom);
  const { goToBattleRewards, reset: resetRouter } = useRouterActions();
  const { syncBattleHp, fullyHealParty } = usePartyActions();

  // On victory, show the arcade rating first; the VICTORY card follows once dismissed.
  const [victoryPhase, setVictoryPhase] = useState<'rating' | 'summary'>('rating');
  // Snapshot the rating once, at the win moment — shared by the rating screen and the send-off line.
  const ratingRef = useRef<BattleRatingResult | null>(null);

  if (gameStatus === 'playing') return null;

  const isVictory = gameStatus === 'won';

  if (isVictory && ratingRef.current === null) {
    const maxHpTotal = battleParty.reduce((sum, c) => sum + c.maxHp, 0);
    const currentHpTotal = battleParty.reduce((sum, c) => sum + c.currentHp, 0);
    ratingRef.current = computeBattleRating({
      elapsedMs: Date.now() - startedAt,
      score,
      maxCombo,
      hpRemainingPct: maxHpTotal > 0 ? currentHpTotal / maxHpTotal : 0,
      itemsUsed,
    });
  }

  if (isVictory && victoryPhase === 'rating' && ratingRef.current) {
    return (
      <BattleRatingScreen
        result={ratingRef.current}
        onContinue={() => setVictoryPhase('summary')}
      />
    );
  }

  const victoryFlavor =
    (ratingRef.current && VICTORY_FLAVOR_BY_STARS[ratingRef.current.stars]) ??
    'You live to fight another day!';

  function handleContinue() {
    if (isVictory) {
      // Carry post-battle HP back to the persistent party before showing rewards.
      syncBattleHp(battleParty);
      const { lootTable, expReward } = combineLootFromEnemies(enemies);
      goToBattleRewards({ lootTable, expReward });
    } else {
      // Defeat: auto-heal the party, reset combat + navigation, and return to the start menu.
      // Also tear down any active dungeon run so re-entry starts fresh at Floor 1
      // (harmless outside a dungeon — the atoms are already at their defaults).
      fullyHealParty();
      resetBattle();
      resetDungeonRun();
      resetRouter();
      setGameStarted(false);
    }
  }

  return (
    <div className="gom-backdrop">
      {/* Ambient drifting sparkles across the backdrop, behind the card —
          gold for victory, red for defeat */}
      <SparkleLayer count={20} variant={isVictory ? 'gold' : 'red'} zIndex={0} />

      <div className={cn('gom-modal', isVictory ? 'gom-modal--victory' : 'gom-modal--defeat')}>
        <div className="gom-content">
          {/* Icon medallion */}
          <div className={cn('gom-icon', isVictory ? 'gom-icon--victory' : 'gom-icon--defeat')}>
            <FrostyRpgIcon name={isVictory ? 'necklace' : 'skull'} size={40} />
          </div>

          {/* Title — bitmap font */}
          <div className="gom-title-group">
            <div className="gom-title">
              {isVictory ? (
                <NarikWoodBitFont text="VICTORY" size={3} />
              ) : (
                <NarikRedwoodBitFont text="DEFEAT" size={3} />
              )}
            </div>
            <p className="gom-subtitle pixel-font">
              {isVictory ? 'You defeated the enemy!' : 'Your party was defeated!'}
            </p>
          </div>

          {/* Divider */}
          <RetroDivider variant={isVictory ? 'victory' : 'defeat'} />

          {/* Message */}
          <div className={cn('gom-message pixel-font', isVictory ? 'gom-message--victory' : 'gom-message--defeat')}>
            {isVictory ? (
              <>
                <p style={{ marginBottom: '0.5rem' }}>Congratulations!</p>
                <p>{victoryFlavor}</p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '0.5rem' }}>Game Over</p>
                <p>Better luck next time, hero!</p>
              </>
            )}
          </div>

          {/* Continue button */}
          <ToffecButton
            variant={isVictory ? 'cream' : 'tan'}
            onClick={handleContinue}
            className={cn('crt-top-highlight mt-5', isVictory ? 'gom-btn--victory' : 'gom-btn--defeat')}
          >
            Continue
          </ToffecButton>
        </div>
      </div>
    </div>
  );
}
