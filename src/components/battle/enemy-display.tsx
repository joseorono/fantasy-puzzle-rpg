import { useAtomValue, useSetAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { enemiesAtom, selectedEnemyIdAtom, selectEnemyAtom, lastDamageAtom } from '~/stores/battle-atoms';
import { cn } from '~/lib/utils';
import { BattleHpBar } from '~/components/battle/battle-hp-bar';
import { DamageDisplay } from '~/components/ui-custom/damage-display';
import type { EnemyData } from '~/types/rpg-elements';

interface EnemySpriteProps {
  enemy: EnemyData;
  isSelected: boolean;
  onSelect: () => void;
}

function EnemySprite({ enemy, isSelected, onSelect }: EnemySpriteProps) {
  const isDead = enemy.currentHp <= 0;
  const lastDamage = useAtomValue(lastDamageAtom);
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  // Show damage animation when this enemy is hit
  useEffect(() => {
    if (lastDamage && lastDamage.target === 'enemy' && lastDamage.enemyId === enemy.id) {
      setDamageAmount(lastDamage.amount);
      setShowDamage(true);
      setAnimationKey((prev) => prev + 1);
      const timer = setTimeout(() => setShowDamage(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastDamage, enemy.id]);

  function handleClick() {
    if (isDead) return;
    onSelect();
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Enemy sprite container */}
      <div className="group relative">
        <div
          onClick={handleClick}
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-lg border-2 transition-all duration-300 sm:h-20 sm:w-20 md:h-24 md:w-24',
            isDead
              ? 'cursor-default border-gray-600 bg-gray-700 opacity-40 grayscale'
              : 'cursor-pointer border-emerald-700 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:scale-105',
            isSelected && !isDead && 'enemy-selected border-yellow-400',
            'enemy-sprite-container',
          )}
        >
          {enemy.sprite.startsWith('/') ? (
            <img src={enemy.sprite} alt={enemy.name} className="enemy-sprite-image h-full w-full" />
          ) : (
            <div className="text-3xl sm:text-4xl md:text-5xl">{enemy.sprite}</div>
          )}

          {/* Death indicator */}
          {isDead && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl opacity-80 sm:text-3xl">💀</div>
            </div>
          )}
        </div>

        {/* Selected arrow indicator */}
        {isSelected && !isDead && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce text-sm text-yellow-400 sm:-top-5 sm:text-base">
            ▼
          </div>
        )}

        {/* Per-enemy damage number */}
        {showDamage && (
          <div
            key={animationKey}
            className="damage-number pointer-events-none absolute -top-6 left-1/2 z-30 -translate-x-1/2 sm:-top-8"
          >
            <DamageDisplay
              amount={damageAmount}
              type={damageAmount > 20 ? 'critical' : 'damage'}
              className="text-xl sm:text-2xl md:text-3xl"
            />
          </div>
        )}

        {/* Impact flash effect on hit */}
        {showDamage && (
          <div
            key={`flash-${animationKey}`}
            className="pointer-events-none absolute inset-0 rounded-lg bg-red-500/40"
            style={{ animation: 'flash-fade 0.3s ease-out forwards' }}
          />
        )}
      </div>

      {/* Enemy name */}
      <div
        className={cn(
          'pixel-font text-[8px] font-bold uppercase sm:text-[10px]',
          isDead ? 'text-gray-500 line-through' : 'text-emerald-300',
        )}
      >
        {enemy.name}
      </div>

      {/* HP bar */}
      <BattleHpBar
        currentHp={enemy.currentHp}
        maxHp={enemy.maxHp}
        className="max-w-[70px] sm:max-w-[85px] md:max-w-[100px]"
      />
    </div>
  );
}

export function EnemyDisplay() {
  const enemies = useAtomValue(enemiesAtom);
  const selectedEnemyId = useAtomValue(selectedEnemyIdAtom);
  const selectEnemy = useSetAtom(selectEnemyAtom);

  return (
    <div className="relative flex xl:h-[45vh] 2xl:h-[44vh] flex-col items-center justify-center p-2 sm:p-3 md:p-4">
      {/* Enemy party grid */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="flex gap-3 sm:gap-4 md:gap-6 2xl:gap-12 2xl:scale-100">
          {enemies.map((enemy) => (
            <EnemySprite
              key={enemy.id}
              enemy={enemy}
              isSelected={enemy.id === selectedEnemyId}
              onSelect={() => selectEnemy(enemy.id)}
            />
          ))}
        </div>
      </div>

      {/* Enemy section label */}
      <div className="w-full max-w-xs px-2 mb-15 xl:mt-5 xl:py-2">
        <div className="text-center">
          <h2 className="pixel-font xl:-mt-5 scale-90 text-sm font-bold tracking-wider text-white uppercase sm:text-base md:text-lg">
            ENEMIES
          </h2>
        </div>
      </div>
    </div>
  );
}
