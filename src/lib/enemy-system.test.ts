import { describe, it, expect } from 'vitest';
import type { EnemyData } from '~/types/rpg-elements';
import { getNextLivingEnemyId } from './battle-system';

const createTestEnemy = (overrides: Partial<EnemyData> = {}): EnemyData =>
  ({
    id: 'enemy-1',
    name: 'Test Enemy',
    type: 'beast',
    stats: { pow: 10, vit: 10, spd: 5 },
    vitHpMultiplier: 3,
    maxHp: 50,
    currentHp: 50,
    sprite: '?',
    attackInterval: 3000,
    attackDamage: 10,
    lootTable: {},
    expReward: 10,
    ...overrides,
  }) as unknown as EnemyData;

describe('getNextLivingEnemyId', () => {
  it('should return the next living enemy after the current one', () => {
    const enemies = [
      createTestEnemy({ id: 'a', currentHp: 50 }),
      createTestEnemy({ id: 'b', currentHp: 50 }),
      createTestEnemy({ id: 'c', currentHp: 50 }),
    ];

    expect(getNextLivingEnemyId(enemies, 'a')).toBe('b');
    expect(getNextLivingEnemyId(enemies, 'b')).toBe('c');
  });

  it('should wrap around to the first enemy', () => {
    const enemies = [
      createTestEnemy({ id: 'a', currentHp: 50 }),
      createTestEnemy({ id: 'b', currentHp: 50 }),
      createTestEnemy({ id: 'c', currentHp: 50 }),
    ];

    expect(getNextLivingEnemyId(enemies, 'c')).toBe('a');
  });

  it('should skip dead enemies', () => {
    const enemies = [
      createTestEnemy({ id: 'a', currentHp: 50 }),
      createTestEnemy({ id: 'b', currentHp: 0 }),
      createTestEnemy({ id: 'c', currentHp: 50 }),
    ];

    expect(getNextLivingEnemyId(enemies, 'a')).toBe('c');
  });

  it('should return null when all enemies are dead', () => {
    const enemies = [
      createTestEnemy({ id: 'a', currentHp: 0 }),
      createTestEnemy({ id: 'b', currentHp: 0 }),
    ];

    expect(getNextLivingEnemyId(enemies, 'a')).toBeNull();
  });

  it('should handle a single living enemy', () => {
    const enemies = [createTestEnemy({ id: 'a', currentHp: 50 })];

    expect(getNextLivingEnemyId(enemies, 'a')).toBe('a');
  });

  it('should find the only living enemy when current is dead', () => {
    const enemies = [
      createTestEnemy({ id: 'a', currentHp: 0 }),
      createTestEnemy({ id: 'b', currentHp: 0 }),
      createTestEnemy({ id: 'c', currentHp: 30 }),
    ];

    expect(getNextLivingEnemyId(enemies, 'a')).toBe('c');
  });
});
