import type { EnemyAttackVariant, EnemyData } from '~/types/rpg-elements';

export interface ResolvedEnemyAttack {
  attackIndex: number;
  variant: EnemyAttackVariant | null;
  intervalMultiplier: number;
  damageMultiplier: number;
  guardBreakMultiplier: number;
}

/** Which attack a cycle fires and the effective multipliers for that hit. Absent/empty attacks = the implicit single attack (index 0, all multipliers 1). */
export function resolveEnemyAttackCycle(
  enemy: Pick<EnemyData, 'attacks'>,
  cycleIndex: number,
): ResolvedEnemyAttack {
  const attacks = enemy.attacks;
  if (!attacks || attacks.length === 0) {
    return {
      attackIndex: 0,
      variant: null,
      intervalMultiplier: 1,
      damageMultiplier: 1,
      guardBreakMultiplier: 1,
    };
  }

  // Positive modulo so a wrapped or negative cycle still lands on a real variant.
  const attackIndex = ((cycleIndex % attacks.length) + attacks.length) % attacks.length;
  const variant = attacks[attackIndex];
  return {
    attackIndex,
    variant,
    intervalMultiplier: variant.intervalMultiplier ?? 1,
    damageMultiplier: variant.damageMultiplier,
    guardBreakMultiplier: variant.guardBreakMultiplier ?? 1,
  };
}
