import { useAtomValue } from 'jotai';
import { gameStatusAtom, enemiesAtom } from '~/stores/battle-atoms';
import { useRouterActions } from '~/stores/game-store';
import { Trophy, Skull } from 'lucide-react';
import { cn } from '~/lib/utils';
import { combineLootFromEnemies } from '~/lib/loot';
import { FancyBorderPixelButton } from '~/components/ui/fancy-border-pixel-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';

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
        <ToffecBeigeCornersWrapper alwaysVisible className="gom-corners-wrapper">
          <div className="gom-content">
            {/* Icon medallion */}
            <div className={cn('gom-icon', isVictory ? 'gom-icon--victory' : 'gom-icon--defeat')}>
              {isVictory ? (
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
              ) : (
                <Skull className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
              )}
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
            <hr className={cn('gom-divider', isVictory ? 'gom-divider--victory' : 'gom-divider--defeat')} />

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

            {/* Continue button — sensitize variant for bg-board */}
            <FancyBorderPixelButton
              onClick={handleContinue}
              className="gom-continue-btn"
              fillColor={isVictory ? '#c8a84e' : '#8b3a3a'}
              textColor={isVictory ? '#3a2a0a' : '#f0d0d0'}
              frameOuterColor={isVictory ? '#7a5c1a' : '#4a1515'}
              frameInnerColor={isVictory ? '#e8d48a' : '#c06060'}
            >
              Continue
            </FancyBorderPixelButton>
          </div>
        </ToffecBeigeCornersWrapper>

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
