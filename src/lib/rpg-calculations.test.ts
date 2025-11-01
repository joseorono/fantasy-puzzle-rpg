import { expect, test, describe } from 'vitest';
import * as rpg from './rpg-calculations';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';

// ============================================================================
// Test Data
// ============================================================================

const mockCharacter: CharacterData = {
  id: 'test-warrior',
  name: 'Test Warrior',
  maxHp: 100,
  currentHp: 100,
  stats: { pow: 20, vit: 15, spd: 10 },
  vitHpMultiplier: 5,
  class: 'warrior',
  color: 'blue',
  skillCooldown: 0,
  maxCooldown: 3,
  baseHp: 100,
  potentialStats: { pow: 20, vit: 15, spd: 10 },
  level: 1,
  expToNextLevel: 100,
};

const mockEnemy: EnemyData = {
  id: 'test-enemy',
  name: 'Test Enemy',
  maxHp: 200,
  currentHp: 200,
  stats: { pow: 15, vit: 20, spd: 5 },
  vitHpMultiplier: 5,
  type: 'test',
  sprite: '👾',
  attackInterval: 4000,
  attackDamage: 25,
};

// ============================================================================
// HP Calculations
// ============================================================================

describe('HP Calculations', () => {
  test('calculateMaxHp: Base calculation', () => {
    const result = rpg.calculateMaxHp(100, 10, 5);
    expect(result).toBe(150); // 100 + (10 * 5)
  });

  test('calculateMaxHp: With different multiplier', () => {
    const result = rpg.calculateMaxHp(100, 10, 10);
    expect(result).toBe(200); // 100 + (10 * 10)
  });

  test('calculateMaxHp: Floors decimal results', () => {
    const result = rpg.calculateMaxHp(100, 7, 3);
    expect(result).toBe(121); // 100 + (7 * 3) = 121
  });

  test('calculateMaxHp: Handles zero VIT', () => {
    const result = rpg.calculateMaxHp(100, 0, 5);
    expect(result).toBe(100);
  });

  test('calculateEntityMaxHp: Uses entity vitHpMultiplier', () => {
    // mockCharacter has maxHp: 100, vit: 15, vitHpMultiplier: 5
    // baseHp = 100 - (15 * 5) = 25
    // recalculated = 25 + (15 * 5) = 100
    const result = rpg.calculateEntityMaxHp(mockCharacter);
    expect(result).toBe(100);
  });

  test('calculateEntityMaxHp: Works with different multipliers', () => {
    const tankChar: CharacterData = {
      ...mockCharacter,
      stats: { ...mockCharacter.stats, vit: 20 },
      vitHpMultiplier: 6,
      maxHp: 50 + (20 * 6), // 170
    };
    const result = rpg.calculateEntityMaxHp(tankChar);
    expect(result).toBe(170);
  });

  test('calculatePartyMaxHp: Sums all party members', () => {
    const party: CharacterData[] = [
      { ...mockCharacter, maxHp: 100 },
      { ...mockCharacter, id: 'char2', maxHp: 80 },
      { ...mockCharacter, id: 'char3', maxHp: 120 },
    ];
    const result = rpg.calculatePartyMaxHp(party);
    expect(result).toBe(300);
  });

  test('calculatePartyCurrentHp: Sums current HP', () => {
    const party: CharacterData[] = [
      { ...mockCharacter, currentHp: 50, maxHp: 100 },
      { ...mockCharacter, id: 'char2', currentHp: 30, maxHp: 80 },
      { ...mockCharacter, id: 'char3', currentHp: 100, maxHp: 120 },
    ];
    const result = rpg.calculatePartyCurrentHp(party);
    expect(result).toBe(180);
  });

  test('calculatePartyHpPercentage: Calculates percentage', () => {
    const party: CharacterData[] = [
      { ...mockCharacter, currentHp: 50, maxHp: 100 },
      { ...mockCharacter, id: 'char2', currentHp: 50, maxHp: 100 },
    ];
    const result = rpg.calculatePartyHpPercentage(party);
    expect(result).toBe(50); // 100/200 = 50%
  });

  test('calculatePartyHpPercentage: Handles zero max HP', () => {
    const party: CharacterData[] = [];
    const result = rpg.calculatePartyHpPercentage(party);
    expect(result).toBe(0);
  });
});

// ============================================================================
// Damage Calculations
// ============================================================================

describe('Damage Calculations', () => {
  test('calculateDamage: Base calculation', () => {
    const result = rpg.calculateDamage(100, 20);
    expect(result).toBe(120); // 100 * (1 + 20/100) = 100 * 1.2 = 120
  });

  test('calculateDamage: Zero power', () => {
    const result = rpg.calculateDamage(100, 0);
    expect(result).toBe(100);
  });

  test('calculateDamage: High power', () => {
    const result = rpg.calculateDamage(100, 100);
    expect(result).toBe(200); // 100 * (1 + 100/100) = 100 * 2 = 200
  });

  test('calculateDamage: Floors decimal results', () => {
    const result = rpg.calculateDamage(100, 15);
    expect(result).toBe(115); // 100 * 1.15 = 115
  });

  test('calculateCharacterDamage: Uses character POW', () => {
    const result = rpg.calculateCharacterDamage(mockCharacter, 100);
    expect(result).toBe(120); // 100 * (1 + 20/100)
  });

  test('calculateEnemyDamage: Uses enemy POW and base damage', () => {
    const result = rpg.calculateEnemyDamage(mockEnemy);
    expect(result).toBe(28); // 25 * (1 + 15/100) = 28.75 -> 28
  });

  test('calculateMatchDamage: 3-match without power', () => {
    const result = rpg.calculateMatchDamage(3, 10, 0);
    expect(result).toBe(10);
  });

  test('calculateMatchDamage: 5-match combo multiplier', () => {
    const result = rpg.calculateMatchDamage(5, 10, 0);
    expect(result).toBe(17); // 10 * 1.7 (combo multiplier)
  });

  test('calculateMatchDamage: With power bonus', () => {
    const result = rpg.calculateMatchDamage(3, 10, 20);
    expect(result).toBe(12); // 10 * 1 * 1.2 = 12
  });

  test('calculateMatchMultiplier returns correct multipliers', () => {
    // Normal cases
    expect(rpg.calculateMatchMultiplier(3)).toBe(1);    // 3-match: 1x
    expect(rpg.calculateMatchMultiplier(4)).toBe(1.5);  // 4-match: 1.5x
    expect(rpg.calculateMatchMultiplier(5)).toBe(1.7);  // 5-match: 1.7x
    
    // 6+ matches: 2x
    expect(rpg.calculateMatchMultiplier(6)).toBe(2);
    expect(rpg.calculateMatchMultiplier(7)).toBe(2);
    expect(rpg.calculateMatchMultiplier(8)).toBe(2);
    expect(rpg.calculateMatchMultiplier(10)).toBe(2);
  });

  test('calculateMatchMultiplier: Handles edge cases', () => {
    expect(rpg.calculateMatchMultiplier(2)).toBe(1); // Below minimum
    expect(rpg.calculateMatchMultiplier(0)).toBe(1); // Zero
  });

  test('calculateMatchDamage: 5-match with power', () => {
    const result = rpg.calculateMatchDamage(5, 10, 20);
    expect(result).toBe(20); // (10 * 1.7) * (1 + 20/100) = 20.4 -> 20
  });
});

// ============================================================================
// Speed Calculations
// ============================================================================

describe('Speed Calculations', () => {
  test('calculateAttackInterval: Base calculation', () => {
    const result = rpg.calculateAttackInterval(4000, 20);
    expect(result).toBe(3333); // 4000 / (1 + 20/100) = 4000 / 1.2 = 3333.33 -> 3333
  });

  test('calculateAttackInterval: Zero speed', () => {
    const result = rpg.calculateAttackInterval(4000, 0);
    expect(result).toBe(4000);
  });

  test('calculateAttackInterval: High speed', () => {
    const result = rpg.calculateAttackInterval(4000, 100);
    expect(result).toBe(2000); // 4000 / 2 = 2000
  });

  test('calculateCooldown: Base calculation', () => {
    const result = rpg.calculateCooldown(3, 20);
    expect(result).toBe(2.5); // 3 / (1 + 20/100) = 3 / 1.2 = 2.5
  });

  test('calculateCooldown: Zero speed', () => {
    const result = rpg.calculateCooldown(3, 0);
    expect(result).toBe(3);
  });

  test('calculateCooldownFillRate: Calculates per-second rate', () => {
    const result = rpg.calculateCooldownFillRate(2, 0);
    expect(result).toBe(0.5); // 1/2 = 0.5 fills per second
  });

  test('calculateCooldownFillRate: With speed bonus', () => {
    const result = rpg.calculateCooldownFillRate(2, 100);
    expect(result).toBe(1); // 1/(2/2) = 1 fill per second
  });

  test('calculateEnemyAttackInterval: Uses enemy SPD', () => {
    const result = rpg.calculateEnemyAttackInterval(mockEnemy);
    expect(result).toBe(3809); // 4000 / (1 + 5/100) = 3809.52 -> 3809
  });

  test('calculateCharacterCooldown: Uses character SPD', () => {
    const result = rpg.calculateCharacterCooldown(mockCharacter);
    expect(result).toBeCloseTo(2.727, 2); // 3 / (1 + 10/100) = 2.727...
  });
});

// ============================================================================
// Stat Utilities
// ============================================================================

describe('Stat Utilities', () => {
  test('createStats: Creates with defaults', () => {
    const result = rpg.createStats();
    expect(result).toEqual({ pow: 0, vit: 0, spd: 0 });
  });

  test('createStats: Creates with custom values', () => {
    const result = rpg.createStats(10, 20, 30);
    expect(result).toEqual({ pow: 10, vit: 20, spd: 30 });
  });

  test('validateStats: Valid stats', () => {
    const result = rpg.validateStats({ pow: 10, vit: 20, spd: 30 });
    expect(result).toBe(true);
  });

  test('validateStats: Zero stats are valid', () => {
    const result = rpg.validateStats({ pow: 0, vit: 0, spd: 0 });
    expect(result).toBe(true);
  });

  test('validateStats: Negative stats are invalid', () => {
    const result1 = rpg.validateStats({ pow: -1, vit: 20, spd: 30 });
    expect(result1).toBe(false);

    const result2 = rpg.validateStats({ pow: 10, vit: -1, spd: 30 });
    expect(result2).toBe(false);

    const result3 = rpg.validateStats({ pow: 10, vit: 20, spd: -1 });
    expect(result3).toBe(false);
  });
});
