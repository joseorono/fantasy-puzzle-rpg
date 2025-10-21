import { useAtomValue } from 'jotai';
import { enemyAtom } from '~/stores/battle-atoms';
import { calculatePercentage } from '~/lib/math';

export function EnemyDisplay() {
  const enemy = useAtomValue(enemyAtom);
  const enemyHealthPercentage = calculatePercentage(enemy.currentHp, enemy.maxHp);

  return (
    <div className="relative h-full flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 bg-gradient-to-b from-emerald-900/30 to-emerald-950/50">

      {/* Enemy Sprite */}
      <div className="relative flex-1 flex items-center justify-center">
        {/* Enemy container with pixel art effect */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />

          {/* Enemy sprite placeholder - will be replaced with actual pixel art */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center">
            {/* Pixel art style enemy */}
            <div className="relative w-full h-full bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-lg border-4 border-emerald-700"
              style={{ imageRendering: 'pixelated' }}
            >
              {/* Simple moss golem representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl sm:text-6xl md:text-7xl opacity-90 animate-pulse">
                  🗿
                </div>
              </div>

              {/* Moss texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-transparent to-green-700/20" />

              {/* Eyes */}
              <div className="absolute top-1/3 left-1/3 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full border border-yellow-600" />
              <div className="absolute top-1/3 right-1/3 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full border border-yellow-600" />
            </div>
          </div>
        </div>

        {/* Damage numbers placeholder */}
        <div className="absolute top-8 right-8 text-red-500 font-bold text-4xl pixel-font opacity-0 animate-ping">
          -25
        </div>
      </div>

      {/* Enemy Info */}
      <div className="w-full max-w-xs px-2">
        <div className="text-center mb-1.5 sm:mb-2">
          <h2 className="text-white font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider pixel-font mb-0.5">
            {enemy.name}
          </h2>
          <p className="text-emerald-300 text-xs sm:text-sm pixel-font">
            Level 5 {enemy.type}
          </p>
        </div>

        {/* Enemy Health Bar */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider pixel-font">
            HP
          </span>
          <span className="text-white font-bold text-xs sm:text-sm pixel-font">
            {enemy.currentHp} / {enemy.maxHp}
          </span>
        </div>
        <div className="relative h-4 sm:h-5 md:h-6 bg-gray-800 border-2 sm:border-3 border-gray-700 rounded-none">
          {/* Health bar fill */}
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 relative overflow-hidden"
            style={{ width: `${enemyHealthPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

            {/* Segmented bars effect */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-red-900/50" />
              ))}
            </div>
          </div>
          {/* Pixel border effect */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
