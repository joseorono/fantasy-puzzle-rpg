/**
 * Pure functions for enemy management during combat.
 */

import type { EnemyData } from '~/types/rpg-elements';

/**
 * Returns the ID of the next living enemy after the current one, wrapping around
 * the encounter order. Useful for auto-selecting a new target when the current
 * enemy dies.
 * @param enemies - Array of enemies in encounter order
 * @param currentId - ID of the currently selected enemy
 * @returns ID of the next living enemy, or null if all are dead
 * @example
 * ```ts
 * const next = getNextLivingEnemyId(enemies, 'frog-1');
 * if (next) selectEnemy(next);
 * ```
 */
export function getNextLivingEnemyId(enemies: EnemyData[], currentId: string): string | null {
  const living = enemies.filter((e) => e.currentHp > 0);
  if (living.length === 0) return null;

  const currentIndex = enemies.findIndex((e) => e.id === currentId);
  for (let i = 1; i <= enemies.length; i++) {
    const idx = (currentIndex + i) % enemies.length;
    if (enemies[idx].currentHp > 0) return enemies[idx].id;
  }

  return living[0].id;
}
