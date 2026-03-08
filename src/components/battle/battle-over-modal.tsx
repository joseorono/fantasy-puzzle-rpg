import { useAtomValue } from 'jotai';
import { gameStatusAtom, enemiesAtom } from '~/stores/battle-atoms';
import { useRouterActions } from '~/stores/game-store';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { combineLootFromEnemies } from '~/lib/loot';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { RetroDivider } from '~/components/ui-custom/retro-divider';

export function BattleOverModal() {
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemies = useAtomValue(enemiesAtom);
  const { goToBattleRewards, goBack } = useRouterActions();

  if (gameStatus === 'playing') return null;

  const isVictory = gameStatus === 'won';

  function handleContinue() {
    if (isVictory) {
      const { lootTable, expReward } = combineLootFromEnemies(enemies);
      goToBattleRewards({ lootTable, expReward });
    } else {
      goBack();
    }
  }

  return (
    <div className="gom-backdrop">
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
                  <p>The realm is safe once more!</p>
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
              className={cn('crt-top-highlight', isVictory ? 'gom-btn--victory' : 'gom-btn--defeat')}
            >
              Continue
            </ToffecButton>
          </div>

        {/* Victory sparkles */}
        {isVictory && (
          <div className="gom-sparkles">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="gom-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
