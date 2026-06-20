import { useAtomValue, useSetAtom } from 'jotai';
import { gameStatusAtom, enemiesAtom, partyAtom, resetBattleAtom } from '~/stores/battle-atoms';
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
  const resetBattle = useSetAtom(resetBattleAtom);
  const setGameStarted = useSetAtom(isGameStartedAtom);
  const { goToBattleRewards, reset: resetRouter } = useRouterActions();
  const { syncBattleHp, fullyHealParty } = usePartyActions();

  if (gameStatus === 'playing') return null;

  const isVictory = gameStatus === 'won';

  function handleContinue() {
    if (isVictory) {
      // Carry post-battle HP back to the persistent party before showing rewards.
      syncBattleHp(battleParty);
      const { lootTable, expReward } = combineLootFromEnemies(enemies);
      goToBattleRewards({ lootTable, expReward });
    } else {
      // Defeat: auto-heal the party, reset combat + navigation, and return to the start menu.
      fullyHealParty();
      resetBattle();
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
                <p>You live to fight another day!</p>
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
