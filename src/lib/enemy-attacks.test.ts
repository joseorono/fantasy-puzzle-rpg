import { describe, it, expect } from 'vitest';
import { resolveEnemyAttackCycle } from './enemy-attacks';
import type { EnemyAttackVariant } from '~/types/rpg-elements';

const variants: EnemyAttackVariant[] = [
  { name: 'Tongue', damageMultiplier: 1 },
  { name: 'Spit', intervalMultiplier: 0.6, damageMultiplier: 0.75, guardBreakMultiplier: 0.8 },
];

const implicitAttack = {
  attackIndex: 0,
  variant: null,
  intervalMultiplier: 1,
  damageMultiplier: 1,
  guardBreakMultiplier: 1,
};

describe('resolveEnemyAttackCycle', () => {
  it('treats an absent attacks field as the implicit single attack', () => {
    expect(resolveEnemyAttackCycle({}, 0)).toEqual(implicitAttack);
    expect(resolveEnemyAttackCycle({}, 7)).toEqual(implicitAttack);
  });

  it('treats an empty attacks array as the implicit single attack', () => {
    expect(resolveEnemyAttackCycle({ attacks: [] }, 3)).toEqual(implicitAttack);
  });

  it('applies the variant multipliers and defaults the optional ones', () => {
    const first = resolveEnemyAttackCycle({ attacks: variants }, 0);
    expect(first.attackIndex).toBe(0);
    expect(first.variant).toBe(variants[0]);
    expect(first.intervalMultiplier).toBe(1);
    expect(first.damageMultiplier).toBe(1);
    expect(first.guardBreakMultiplier).toBe(1);

    const second = resolveEnemyAttackCycle({ attacks: variants }, 1);
    expect(second.attackIndex).toBe(1);
    expect(second.variant).toBe(variants[1]);
    expect(second.intervalMultiplier).toBe(0.6);
    expect(second.damageMultiplier).toBe(0.75);
    expect(second.guardBreakMultiplier).toBe(0.8);
  });

  it('alternates two variants across four cycles', () => {
    const indices = [0, 1, 2, 3].map((cycle) => resolveEnemyAttackCycle({ attacks: variants }, cycle).attackIndex);
    expect(indices).toEqual([0, 1, 0, 1]);
  });

  it('keeps a single variant for every cycle', () => {
    const solo: EnemyAttackVariant[] = [{ name: 'Tongue', damageMultiplier: 1 }];
    for (const cycle of [0, 1, 2, 5]) {
      expect(resolveEnemyAttackCycle({ attacks: solo }, cycle).attackIndex).toBe(0);
    }
  });

  it('wraps a negative cycle index with a positive modulo', () => {
    expect(resolveEnemyAttackCycle({ attacks: variants }, -1).attackIndex).toBe(1);
  });
});
