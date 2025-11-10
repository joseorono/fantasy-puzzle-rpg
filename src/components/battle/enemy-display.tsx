import { useAtomValue } from 'jotai';
import { enemyAtom } from '~/stores/battle-atoms';
import { calculatePercentage } from '~/lib/math';

export function EnemyDisplay() {
  const enemy = useAtomValue(enemyAtom);
  const enemyHealthPercentage = calculatePercentage(enemy.currentHp, enemy.maxHp);

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-b from-emerald-900/30 to-emerald-950/50 p-2 sm:p-3 md:p-4">
      {/* Enemy Sprite */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Enemy container with pixel art effect */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 scale-150 rounded-full bg-emerald-500/20 blur-2xl" />

          {/* Enemy sprite placeholder - will be replaced with actual pixel art */}
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32 md:h-40 md:w-40">
            {/* Pixel art style enemy */}
            <div
              className="relative h-full w-full rounded-lg border-4 border-emerald-700 bg-gradient-to-b from-emerald-600 to-emerald-800"
              style={{ imageRendering: 'pixelated' }}
            >
              {/* Simple moss golem representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-5xl opacity-90 sm:text-6xl md:text-7xl">🗿</div>
              </div>

              {/* Moss texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-transparent to-green-700/20" />

              {/* Eyes */}
              <div className="absolute top-1/3 left-1/3 h-2 w-2 rounded-full border border-yellow-600 bg-yellow-400 sm:h-3 sm:w-3" />
              <div className="absolute top-1/3 right-1/3 h-2 w-2 rounded-full border border-yellow-600 bg-yellow-400 sm:h-3 sm:w-3" />
            </div>
          </div>
        </div>

        {/* Damage numbers placeholder */}
        <div className="pixel-font absolute top-8 right-8 animate-ping text-4xl font-bold text-red-500 opacity-0">
          -25
        </div>
      </div>

      {/* Enemy Info */}
      <div className="w-full max-w-xs px-2">
        <div className="mb-1.5 text-center sm:mb-2">
          <h2 className="pixel-font mb-0.5 text-sm font-bold tracking-wider text-white uppercase sm:text-base md:text-lg">
            {enemy.name}
          </h2>
          <p className="pixel-font text-xs text-emerald-300 sm:text-sm">Level 5 {enemy.type}</p>
        </div>

        {/* Enemy Health Bar */}
        <div className="mb-1 flex items-center justify-between">
          <span className="pixel-font text-xs font-bold tracking-wider text-white uppercase sm:text-sm">HP</span>
          <span className="pixel-font text-xs font-bold text-white sm:text-sm">
            {enemy.currentHp} / {enemy.maxHp}
          </span>
        </div>
        <div className="relative h-4 rounded-none border-2 border-gray-700 bg-gray-800 sm:h-5 sm:border-3 md:h-6">
          {/* Health bar fill */}
          <div
            className="relative h-full overflow-hidden bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
            style={{ width: `${enemyHealthPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Segmented bars effect */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-red-900/50" />
              ))}
            </div>
          </div>
          {/* Pixel border effect */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
