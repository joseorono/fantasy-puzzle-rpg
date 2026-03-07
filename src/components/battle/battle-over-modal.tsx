import { useAtomValue } from 'jotai';
import { gameStatusAtom, enemiesAtom } from '~/stores/battle-atoms';
import { useRouterActions } from '~/stores/game-store';
import { Trophy, Skull } from 'lucide-react';
import { cn } from '~/lib/utils';
import { combineLootFromEnemies } from '~/lib/loot';
import { StyledButton } from '~/components/ui/styled-button';

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
      <div className={cn('gom-modal crt-container crt-overlay', isVictory ? 'gom-modal--victory' : 'gom-modal--defeat')}>
        <div className="gom-content">
          {/* Icon medallion */}
          <div className={cn('gom-icon', isVictory ? 'gom-icon--victory' : 'gom-icon--defeat')}>
            {isVictory ? (
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
            ) : (
              <Skull className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
            )}
          </div>

          {/* Title */}
          <div className="gom-title-group">
            <h2 className={cn('gom-title crt-text-glow pixel-font-alt', isVictory ? 'gom-title--victory' : 'gom-title--defeat')}>
              {isVictory ? 'VICTORY!' : 'DEFEAT!'}
            </h2>
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

          {/* Continue button */}
          <StyledButton
            hexColor={isVictory ? '#D9C7AC' : '#8B6F47'}
            onClick={handleContinue}
            className={cn('crt-top-highlight', isVictory ? 'gom-btn--victory' : 'gom-btn--defeat')}
          >
            Continue →
          </StyledButton>
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
