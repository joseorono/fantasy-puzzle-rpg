import { describe, it, expect } from 'vitest';
import * as levelingSystem from './leveling-system';
import { calculateMaxHp } from './rpg-calculations';
import type { CharacterData, CoreRPGStats } from '~/types';

// Helper function to create a test character
const createTestCharacter = (overrides: Partial<CharacterData> = {}): CharacterData => ({
  id: 'test-char-1',
  name: 'Test Hero',
  class: 'warrior',
  color: 'blue',
  baseHp: 100,
  maxHp: 120,
  currentHp: 120,
  stats: {
    pow: 10,
    vit: 4,
    spd: 5,
  },
  potentialStats: {
    pow: 50,
    vit: 30,
    spd: 40,
  },
  vitHpMultiplier: 5,
  skillCooldown: 0,
  maxCooldown: 10,
  level: 1,
  expToNextLevel: Math.exp(1),
  ...overrides,
});

describe('calculateExpToNextLevel', () => {
  it('should return exponential value for given level', () => {
    expect(levelingSystem.calculateExpToNextLevel(1)).toBeCloseTo(Math.exp(1), 5);
    expect(levelingSystem.calculateExpToNextLevel(2)).toBeCloseTo(Math.exp(2), 5);
    expect(levelingSystem.calculateExpToNextLevel(5)).toBeCloseTo(Math.exp(5), 5);
  });

  it('should return 1 for level 0', () => {
    expect(levelingSystem.calculateExpToNextLevel(0)).toBe(1);
  });

  it('should increase with level', () => {
    const level1 = levelingSystem.calculateExpToNextLevel(1);
    const level2 = levelingSystem.calculateExpToNextLevel(2);
    const level3 = levelingSystem.calculateExpToNextLevel(3);

    expect(level1).toBeLessThan(level2);
    expect(level2).toBeLessThan(level3);
  });
});

describe('getRandomPotentialStats', () => {
  it('should return null when statAmountToIncrease is 0', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character, 0);
    expect(result).toBeNull();
  });

  it('should return null when no potential stats available', () => {
    const character = createTestCharacter({
      potentialStats: { pow: 0, vit: 0, spd: 0 },
    });
    const result = levelingSystem.getRandomPotentialStats(character, 1);
    expect(result).toBeNull();
  });

  it('should return stat increases object with correct total', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character, 1);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('pow');
    expect(result).toHaveProperty('vit');
    expect(result).toHaveProperty('spd');
    const totalIncrease = result!.pow + result!.vit + result!.spd;
    expect(totalIncrease).toBe(1);
  });

  it('should distribute multiple stat increases', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character, 3);

    expect(result).not.toBeNull();
    const totalIncrease = result!.pow + result!.vit + result!.spd;
    expect(totalIncrease).toBe(3);
  });

  it('should only use stats with available potential', () => {
    const character = createTestCharacter({
      potentialStats: { pow: 0, vit: 20, spd: 0 },
    });
    const result = levelingSystem.getRandomPotentialStats(character, 1);

    expect(result).not.toBeNull();
    expect(result!.vit).toBe(1);
    expect(result!.pow).toBe(0);
    expect(result!.spd).toBe(0);
  });

  it('should decrease potential stats', () => {
    const character = createTestCharacter();
    const initialPotential = { ...character.potentialStats };
    levelingSystem.getRandomPotentialStats(character, 2);

    const totalDecrease =
      initialPotential.pow -
      character.potentialStats.pow +
      (initialPotential.vit - character.potentialStats.vit) +
      (initialPotential.spd - character.potentialStats.spd);
    expect(totalDecrease).toBe(2);
  });
});

describe('levelUp', () => {
  it('should return character unchanged when levelUpAmount is 0', () => {
    const character = createTestCharacter();
    const initialLevel = character.level;
    const chosenStats: CoreRPGStats = { pow: 1, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 0);

    expect(character.level).toBe(initialLevel);
  });

  it('should return character unchanged when levelUpAmount is negative', () => {
    const character = createTestCharacter();
    const initialLevel = character.level;
    const chosenStats: CoreRPGStats = { pow: 1, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, -1);

    expect(character.level).toBe(initialLevel);
  });

  it('should increase chosen stats', () => {
    const character = createTestCharacter();
    const initialPow = character.stats.pow;
    const initialVit = character.stats.vit;
    const chosenStats: CoreRPGStats = { pow: 1, vit: 1, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.stats.pow).toBe(initialPow + 1);
    expect(character.stats.vit).toBe(initialVit + 1);
  });

  it('should increase random stats from CoreRPGStats object', () => {
    const character = createTestCharacter();
    const initialPow = character.stats.pow;
    const initialVit = character.stats.vit;
    const initialSpd = character.stats.spd;
    const initialPowPotential = character.potentialStats.pow;
    const initialVitPotential = character.potentialStats.vit;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    const randomStats: CoreRPGStats = { pow: 1, vit: 1, spd: 0 };
    levelingSystem.levelUp(character, chosenStats, randomStats, 1);

    expect(character.stats.pow).toBe(initialPow + 1);
    expect(character.stats.vit).toBe(initialVit + 1);
    expect(character.stats.spd).toBe(initialSpd);
    expect(character.potentialStats.pow).toBe(initialPowPotential - 1);
    expect(character.potentialStats.vit).toBe(initialVitPotential - 1);
  });

  it('should increase both chosen and random stats', () => {
    const character = createTestCharacter();
    const initialPow = character.stats.pow;
    const initialSpd = character.stats.spd;
    const initialSpdPotential = character.potentialStats.spd;
    const chosenStats: CoreRPGStats = { pow: 1, vit: 0, spd: 0 };

    const randomStats: CoreRPGStats = { pow: 0, vit: 0, spd: 1 };
    levelingSystem.levelUp(character, chosenStats, randomStats, 1);

    expect(character.stats.pow).toBe(initialPow + 1);
    expect(character.stats.spd).toBe(initialSpd + 1);
    expect(character.potentialStats.spd).toBe(initialSpdPotential - 1);
  });

  it('should increase level by levelUpAmount', () => {
    const character = createTestCharacter();
    const initialLevel = character.level;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 3);

    expect(character.level).toBe(initialLevel + 3);
  });

  it('should update expToNextLevel based on new level', () => {
    const character = createTestCharacter();
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 2);

    expect(character.expToNextLevel).toBeCloseTo(Math.exp(character.level), 5);
  });

  it('should recalculate maxHp when vit is increased (chosen stat)', () => {
    const character = createTestCharacter();
    const initialMaxHp = character.maxHp;
    const initialVit = character.stats.vit;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 1, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 1, character.vitHpMultiplier);
    expect(character.maxHp).toBe(expectedMaxHp);
    expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier);
  });

  it('should recalculate maxHp when vit is increased (random stat)', () => {
    const character = createTestCharacter();
    const initialMaxHp = character.maxHp;
    const initialVit = character.stats.vit;
    const initialVitPotential = character.potentialStats.vit;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    const randomStats: CoreRPGStats = { pow: 0, vit: 1, spd: 0 };
    levelingSystem.levelUp(character, chosenStats, randomStats, 1);

    const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 1, character.vitHpMultiplier);
    expect(character.maxHp).toBe(expectedMaxHp);
    expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier);
    expect(character.potentialStats.vit).toBe(initialVitPotential - 1);
  });

  it('should not recalculate maxHp when other stats are increased', () => {
    const character = createTestCharacter();
    const initialMaxHp = character.maxHp;
    const chosenStats: CoreRPGStats = { pow: 1, vit: 0, spd: 0 };

    const randomStats: CoreRPGStats = { pow: 0, vit: 0, spd: 1 };
    levelingSystem.levelUp(character, chosenStats, randomStats, 1);

    expect(character.maxHp).toBe(initialMaxHp);
  });

  it('should handle zero stats for both chosen and random', () => {
    const character = createTestCharacter();
    const initialPow = character.stats.pow;
    const initialVit = character.stats.vit;
    const initialSpd = character.stats.spd;
    const initialLevel = character.level;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.stats.pow).toBe(initialPow);
    expect(character.stats.vit).toBe(initialVit);
    expect(character.stats.spd).toBe(initialSpd);
    expect(character.level).toBe(initialLevel + 1);
  });

  it('should recalculate maxHp when both chosen and random increase vit', () => {
    const character = createTestCharacter();
    const initialMaxHp = character.maxHp;
    const initialVit = character.stats.vit;
    const initialVitPotential = character.potentialStats.vit;
    const chosenStats: CoreRPGStats = { pow: 0, vit: 1, spd: 0 };

    const randomStats: CoreRPGStats = { pow: 0, vit: 1, spd: 0 };
    levelingSystem.levelUp(character, chosenStats, randomStats, 1);

    // VIT increased by 2
    const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 2, character.vitHpMultiplier);
    expect(character.maxHp).toBe(expectedMaxHp);
    expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier * 2);
    expect(character.potentialStats.vit).toBe(initialVitPotential - 1);
  });

  it('should return the modified character', () => {
    const character = createTestCharacter();
    const chosenStats: CoreRPGStats = { pow: 1, vit: 0, spd: 0 };
    const result = levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(result).toBe(character);
  });
});
