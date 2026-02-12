import { describe, it, expect } from 'vitest';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { createBattleState } from './battle-setup';

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
  expToNextLevel: 100,
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

  it('should reset party members to full HP', () => {
    const state = createBattleState(party, enemies);
    for (const member of state.party) {
      expect(member.currentHp).toBe(member.maxHp);
    }
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
    expect(state.selectedOrb).toBeNull();
    expect(state.currentMatches).toEqual([]);
    expect(state.lastDamage).toBeNull();
    expect(state.lastMatchedType).toBeNull();
    expect(state.lastSkillActivation).toBeNull();
  });
});
