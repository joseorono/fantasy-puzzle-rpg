import { describe, it, expect } from 'vitest';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { createBattleState, generateEnemyStandbyDelays } from './battle-system';
import { ENEMY_STANDBY_MIN_MS, ENEMY_STANDBY_MAX_MS } from '~/constants/battle';

/**
 * Deterministic `[0, 1)` source that walks a fixed list of values, wrapping around.
 * Lets us assert exact, reproducible standby splits without touching `Math.random`.
 */
function seededRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

const sumValues = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0);

const createTestCharacter = (overrides: Partial<CharacterData> = {}): CharacterData => ({
  id: 'test-warrior',
  name: 'Test Warrior',
  class: 'warrior',
  color: 'blue',
  stats: { pow: 15, vit: 20, spd: 5 },
  potentialStats: { pow: 15, vit: 20, spd: 5 },
  vitHpMultiplier: 6,
  baseHp: 100,
  maxHp: 100,
  currentHp: 50,
  skillCooldown: 0,
  maxCooldown: 30,
  level: 1,
  currentExp: 0,
  expToNextLevel: 100,
  unlockedSkillIds: ['warrior-power-strike'],
  selectedSkillId: 'warrior-power-strike',
  ...overrides,
});

const createTestEnemy = (overrides: Partial<EnemyData> = {}): EnemyData =>
  ({
    id: 'enemy-1',
    name: 'Test Enemy',
    type: 'beast',
    stats: { pow: 10, vit: 10, spd: 5 },
    vitHpMultiplier: 3,
    maxHp: 50,
    currentHp: 20,
    sprite: '?',
    attackInterval: 3000,
    attackDamage: 10,
    lootTable: {},
    expReward: 10,
    ...overrides,
  }) as unknown as EnemyData;

describe('createBattleState', () => {
  const party = [
    createTestCharacter({ id: 'warrior', currentHp: 30, maxHp: 100 }),
    createTestCharacter({ id: 'healer', class: 'healer', color: 'yellow', currentHp: 20, maxHp: 80 }),
  ];
  const enemies = [
    createTestEnemy({ id: 'frog-1', maxHp: 40, currentHp: 10 }),
    createTestEnemy({ id: 'frog-2', maxHp: 40, currentHp: 0 }),
  ];

  it('should return a BattleState with gameStatus "playing"', () => {
    const state = createBattleState(party, enemies);
    expect(state.gameStatus).toBe('playing');
  });

  it('should reset enemies to full HP', () => {
    const state = createBattleState(party, enemies);
    expect(state.enemies[0].currentHp).toBe(state.enemies[0].maxHp);
    expect(state.enemies[1].currentHp).toBe(state.enemies[1].maxHp);
  });

  it('should carry over party members current HP (no force-heal on entry)', () => {
    const state = createBattleState(party, enemies);
    // No equipment, so effective maxHp equals base maxHp and current HP is preserved.
    expect(state.party[0].currentHp).toBe(30);
    expect(state.party[1].currentHp).toBe(20);
  });

  it('should set skill cooldowns on party members', () => {
    const state = createBattleState(party, enemies);
    for (const member of state.party) {
      expect(member.skillCooldown).toBeGreaterThan(0);
    }
  });

  it('should select the first enemy', () => {
    const state = createBattleState(party, enemies);
    expect(state.selectedEnemyId).toBe('frog-1');
  });

  it('should initialize the board with an 8x6 grid', () => {
    const state = createBattleState(party, enemies);
    expect(state.board).toHaveLength(8);
    for (const row of state.board) {
      expect(row).toHaveLength(6);
    }
  });

  it('should reset combat metadata', () => {
    const state = createBattleState(party, enemies);
    expect(state.score).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.guard).toBe(0);
    expect(state.selectedOrb).toBeNull();
    expect(state.currentMatches).toEqual([]);
    expect(state.lastDamage).toBeNull();
    expect(state.lastMatchedType).toBeNull();
    expect(state.lastSkillActivation).toBeNull();
  });

  it('should generate a standby delay for every enemy', () => {
    const state = createBattleState(party, enemies);
    expect(Object.keys(state.enemyStandbyMs).sort()).toEqual(['frog-1', 'frog-2']);
  });
});

describe('generateEnemyStandbyDelays', () => {
  it('returns an empty map for an empty roster', () => {
    expect(generateEnemyStandbyDelays([])).toEqual({});
  });

  it('gives a single enemy the whole pooled total', () => {
    // One roll consumed for the pool, no cut points needed for count === 1.
    const delays = generateEnemyStandbyDelays(['solo'], seededRng([0]));
    expect(Object.keys(delays)).toEqual(['solo']);
    expect(delays.solo).toBe(ENEMY_STANDBY_MIN_MS);
  });

  it('produces exactly one non-negative integer entry per id', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const delays = generateEnemyStandbyDelays(ids);
    expect(Object.keys(delays).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      expect(delays[id]).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(delays[id])).toBe(true);
    }
  });

  it('preserves the pooled total when re-splitting (sum invariant)', () => {
    // rng always 0: every pool roll = MIN, so total = MIN * count; all cut points = 0,
    // so the last enemy receives the entire total and the rest receive 0.
    const ids = ['a', 'b', 'c'];
    const delays = generateEnemyStandbyDelays(ids, seededRng([0]));
    expect(sumValues(delays)).toBe(ENEMY_STANDBY_MIN_MS * ids.length);
    expect(delays).toEqual({ a: 0, b: 0, c: ENEMY_STANDBY_MIN_MS * ids.length });
  });

  it('keeps the pooled total within [MIN*count, MAX*count] for any rng', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const total = sumValues(generateEnemyStandbyDelays(ids)); // real Math.random
    expect(total).toBeGreaterThanOrEqual(ENEMY_STANDBY_MIN_MS * ids.length);
    expect(total).toBeLessThanOrEqual(ENEMY_STANDBY_MAX_MS * ids.length);
  });

  it('is deterministic for a fixed rng', () => {
    const ids = ['x', 'y', 'z'];
    const a = generateEnemyStandbyDelays(ids, seededRng([0.1, 0.7, 0.3, 0.9, 0.5]));
    const b = generateEnemyStandbyDelays(ids, seededRng([0.1, 0.7, 0.3, 0.9, 0.5]));
    expect(a).toEqual(b);
  });
});
