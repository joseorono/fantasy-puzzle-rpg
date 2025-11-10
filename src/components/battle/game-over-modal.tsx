import { useAtomValue, useSetAtom } from 'jotai';
import { gameStatusAtom, resetBattleAtom } from '~/stores/battle-atoms';
import { Button } from '~/components/ui/8bit/button';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import { cn } from '~/lib/utils';

export function GameOverModal() {
  const gameStatus = useAtomValue(gameStatusAtom);
  const resetBattle = useSetAtom(resetBattleAtom);

  if (gameStatus === 'playing') return null;

  const isVictory = gameStatus === 'won';

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm duration-500">
      {/* Modal container */}
      <div
        className={cn(
          'modal-zoom-in relative mx-4 w-full max-w-sm rounded-lg border-4 p-4 sm:border-6 sm:p-6',
          isVictory
            ? 'border-yellow-400 bg-gradient-to-b from-yellow-500 to-amber-600'
            : 'border-red-500 bg-gradient-to-b from-red-600 to-red-800',
        )}
      >
        {/* Decorative corners */}
        <div
          className={cn(
            'absolute -top-2 -left-2 h-4 w-4 border-2',
            isVictory ? 'border-yellow-300 bg-yellow-400' : 'border-red-400 bg-red-500',
          )}
        />
        <div
          className={cn(
            'absolute -top-2 -right-2 h-4 w-4 border-2',
            isVictory ? 'border-yellow-300 bg-yellow-400' : 'border-red-400 bg-red-500',
          )}
        />
        <div
          className={cn(
            'absolute -bottom-2 -left-2 h-4 w-4 border-2',
            isVictory ? 'border-yellow-300 bg-yellow-400' : 'border-red-400 bg-red-500',
          )}
        />
        <div
          className={cn(
            'absolute -right-2 -bottom-2 h-4 w-4 border-2',
            isVictory ? 'border-yellow-300 bg-yellow-400' : 'border-red-400 bg-red-500',
          )}
        />

        {/* Content */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Icon */}
          <div
            className={cn(
              'relative rounded-full border-4 p-3 sm:border-6 sm:p-4',
              isVictory ? 'animate-bounce border-yellow-200 bg-yellow-300' : 'animate-pulse border-red-300 bg-red-400',
            )}
            style={{
              animationDelay: '0.2s',
            }}
          >
            {isVictory ? (
              <Trophy className="h-10 w-10 text-yellow-700 sm:h-12 sm:w-12" strokeWidth={3} />
            ) : (
              <Skull className="h-10 w-10 text-red-900 sm:h-12 sm:w-12" strokeWidth={3} />
            )}
          </div>

          {/* Title */}
          <div
            className="modal-slide-up text-center"
            style={{
              animationDelay: '0.3s',
            }}
          >
            <h2
              className={cn(
                'pixel-font-alt mb-1 text-2xl font-bold uppercase sm:mb-2 sm:text-3xl md:text-4xl',
                isVictory ? 'text-yellow-900' : 'text-white',
              )}
            >
              {isVictory ? 'VICTORY!' : 'DEFEAT!'}
            </h2>
            <p
              className={cn(
                'pixel-font text-sm sm:text-base md:text-lg',
                isVictory ? 'text-yellow-800' : 'text-red-100',
              )}
            >
              {isVictory ? 'You defeated the enemy!' : 'Your party was defeated!'}
            </p>
          </div>

          {/* Divider */}
          <div className={cn('h-1 w-full', isVictory ? 'bg-yellow-700' : 'bg-red-900')} />

          {/* Message */}
          <div
            className={cn('pixel-font text-center text-xs sm:text-sm', isVictory ? 'text-yellow-900' : 'text-white')}
          >
            {isVictory ? (
              <>
                <p className="mb-2">🎉 Congratulations! 🎉</p>
                <p>The realm is safe once more!</p>
              </>
            ) : (
              <>
                <p className="mb-2">💀 Game Over 💀</p>
                <p>Better luck next time, hero!</p>
              </>
            )}
          </div>

          {/* Button */}
          <Button
            onClick={() => resetBattle()}
            size="default"
            className={cn(
              'pixel-font-alt w-full gap-2 text-sm sm:text-base',
              isVictory
                ? 'bg-yellow-700 text-yellow-100 hover:bg-yellow-800'
                : 'bg-red-900 text-white hover:bg-red-950',
            )}
          >
            <RotateCcw className="h-5 w-5" />
            NEW GAME
          </Button>
        </div>

        {/* Animated particles */}
        {isVictory && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 animate-ping rounded-full bg-yellow-200"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
