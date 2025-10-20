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
  pow: 20,
  vit: 15,
  spd: 10,
  class: 'warrior',
  color: 'blue',
  skillCooldown: 0,
  maxCooldown: 3,
};

const mockEnemy: EnemyData = {
  id: 'test-enemy',
  name: 'Test Enemy',
  maxHp: 200,
  currentHp: 200,
  pow: 15,
  vit: 20,
  spd: 5,
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
    expect(result).toBe(20); // 10 * 2 (combo multiplier)
  });

  test('calculateMatchDamage: With power bonus', () => {
    const result = rpg.calculateMatchDamage(3, 10, 20);
    expect(result).toBe(12); // 10 * (1 + 20/100) = 12
  });

  test('calculateMatchDamage: 5-match with power', () => {
    const result = rpg.calculateMatchDamage(5, 10, 20);
    expect(result).toBe(24); // (10 * 2) * (1 + 20/100) = 24
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
