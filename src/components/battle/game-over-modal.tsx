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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      {/* Modal container */}
      <div
        className={cn(
          'relative w-full max-w-sm mx-4 p-4 sm:p-6 rounded-lg border-4 sm:border-6 modal-zoom-in',
          isVictory
            ? 'bg-gradient-to-b from-yellow-500 to-amber-600 border-yellow-400'
            : 'bg-gradient-to-b from-red-600 to-red-800 border-red-500'
        )}
      >
        {/* Decorative corners */}
        <div className={cn(
          'absolute -top-2 -left-2 w-4 h-4 border-2',
          isVictory ? 'bg-yellow-400 border-yellow-300' : 'bg-red-500 border-red-400'
        )} />
        <div className={cn(
          'absolute -top-2 -right-2 w-4 h-4 border-2',
          isVictory ? 'bg-yellow-400 border-yellow-300' : 'bg-red-500 border-red-400'
        )} />
        <div className={cn(
          'absolute -bottom-2 -left-2 w-4 h-4 border-2',
          isVictory ? 'bg-yellow-400 border-yellow-300' : 'bg-red-500 border-red-400'
        )} />
        <div className={cn(
          'absolute -bottom-2 -right-2 w-4 h-4 border-2',
          isVictory ? 'bg-yellow-400 border-yellow-300' : 'bg-red-500 border-red-400'
        )} />

        {/* Content */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {/* Icon */}
          <div className={cn(
            'relative p-3 sm:p-4 rounded-full border-4 sm:border-6',
            isVictory
              ? 'bg-yellow-300 border-yellow-200 animate-bounce'
              : 'bg-red-400 border-red-300 animate-pulse'
          )}
            style={{
              animationDelay: '0.2s',
            }}>
            {isVictory ? (
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-700" strokeWidth={3} />
            ) : (
              <Skull className="w-10 h-10 sm:w-12 sm:h-12 text-red-900" strokeWidth={3} />
            )}
          </div>

          {/* Title */}
          <div className="text-center modal-slide-up"
            style={{
              animationDelay: '0.3s',
            }}>
            <h2 className={cn(
              'text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 pixel-font-alt uppercase',
              isVictory ? 'text-yellow-900' : 'text-white'
            )}>
              {isVictory ? 'VICTORY!' : 'DEFEAT!'}
            </h2>
            <p className={cn(
              'text-sm sm:text-base md:text-lg pixel-font',
              isVictory ? 'text-yellow-800' : 'text-red-100'
            )}>
              {isVictory
                ? 'You defeated the enemy!'
                : 'Your party was defeated!'}
            </p>
          </div>

          {/* Divider */}
          <div className={cn(
            'w-full h-1',
            isVictory ? 'bg-yellow-700' : 'bg-red-900'
          )} />

          {/* Message */}
          <div className={cn(
            'text-center text-xs sm:text-sm pixel-font',
            isVictory ? 'text-yellow-900' : 'text-white'
          )}>
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
              'w-full text-sm sm:text-base pixel-font-alt gap-2',
              isVictory
                ? 'bg-yellow-700 hover:bg-yellow-800 text-yellow-100'
                : 'bg-red-900 hover:bg-red-950 text-white'
            )}
          >
            <RotateCcw className="w-5 h-5" />
            NEW GAME
          </Button>
        </div>

        {/* Animated particles */}
        {isVictory && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-200 rounded-full animate-ping"
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
