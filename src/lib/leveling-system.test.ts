import { expect, test } from 'vitest';

import * as levelingSystem from './leveling-system';
import { calculateMaxHp } from './rpg-calculations';
import type { CharacterData } from '~/types';

// Helper function to create a test character
function createTestCharacter(overrides?: Partial<CharacterData>): CharacterData {
  return {
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
  };
}

test('calculateExpToNextLevel: Returns exponential value', () => {
  const result1 = levelingSystem.calculateExpToNextLevel(1);
  expect(result1).toBeCloseTo(Math.exp(1), 5);

  const result2 = levelingSystem.calculateExpToNextLevel(2);
  expect(result2).toBeCloseTo(Math.exp(2), 5);

  const result3 = levelingSystem.calculateExpToNextLevel(5);
  expect(result3).toBeCloseTo(Math.exp(5), 5);
});

test('calculateExpToNextLevel: Returns 1 for level 0', () => {
  const result = levelingSystem.calculateExpToNextLevel(0);
  expect(result).toBe(1);
});

test('calculateExpToNextLevel: Increases with level', () => {
  const level1 = levelingSystem.calculateExpToNextLevel(1);
  const level2 = levelingSystem.calculateExpToNextLevel(2);
  const level3 = levelingSystem.calculateExpToNextLevel(3);

  expect(level1).toBeLessThan(level2);
  expect(level2).toBeLessThan(level3);
});

test('getPotentialStat: Returns a valid stat from potentialStats', () => {
  const character = createTestCharacter();
  const result = levelingSystem.getPotentialStat(character);

  expect(result).not.toBeNull();
  expect(['pow', 'vit', 'spd']).toContain(result);
  expect(character.potentialStats[result!]).toBeGreaterThan(0);
});

test('getPotentialStat: Returns null when no potential stats available', () => {
  const character = createTestCharacter({
    potentialStats: { pow: 0, vit: 0, spd: 0 },
  });
  const result = levelingSystem.getPotentialStat(character);

  expect(result).toBeNull();
});

test('getPotentialStat: Filters out zero-value stats', () => {
  const character = createTestCharacter({
    potentialStats: { pow: 0, vit: 20, spd: 0 },
  });
  const result = levelingSystem.getPotentialStat(character);

  expect(result).toBe('vit');
});

test('getPotentialStat: Returns one of multiple available stats', () => {
  const character = createTestCharacter({
    potentialStats: { pow: 10, vit: 10, spd: 10 },
  });
  const results = new Set<string>();

  // Call multiple times to get distribution
  for (let i = 0; i < 30; i++) {
    const result = levelingSystem.getPotentialStat(character);
    if (result) results.add(result);
  }

  // Should get at least 2 different stats over 30 calls
  expect(results.size).toBeGreaterThanOrEqual(2);
});

test('levelUp: Increases chosen stat and decreases potential', () => {
  const character = createTestCharacter();
  const initialPow = character.stats.pow;
  const initialPowPotential = character.potentialStats.pow;

  levelingSystem.levelUp(character, 'pow', null);

  expect(character.stats.pow).toBe(initialPow + 1);
  expect(character.potentialStats.pow).toBe(initialPowPotential - 1);
});

test('levelUp: Increases random stat and decreases potential', () => {
  const character = createTestCharacter();
  const initialVit = character.stats.vit;
  const initialVitPotential = character.potentialStats.vit;

  levelingSystem.levelUp(character, null, 'vit');

  expect(character.stats.vit).toBe(initialVit + 1);
  expect(character.potentialStats.vit).toBe(initialVitPotential - 1);
});

test('levelUp: Increases both chosen and random stats', () => {
  const character = createTestCharacter();
  const initialPow = character.stats.pow;
  const initialSpd = character.stats.spd;
  const initialPowPotential = character.potentialStats.pow;
  const initialSpdPotential = character.potentialStats.spd;

  levelingSystem.levelUp(character, 'pow', 'spd');

  expect(character.stats.pow).toBe(initialPow + 1);
  expect(character.stats.spd).toBe(initialSpd + 1);
  expect(character.potentialStats.pow).toBe(initialPowPotential - 1);
  expect(character.potentialStats.spd).toBe(initialSpdPotential - 1);
});

test('levelUp: Increases level', () => {
  const character = createTestCharacter();
  const initialLevel = character.level;

  levelingSystem.levelUp(character, 'pow', null);

  expect(character.level).toBe(initialLevel + 1);
});

test('levelUp: Updates expToNextLevel', () => {
  const character = createTestCharacter();
  const initialExpToNextLevel = character.expToNextLevel;

  levelingSystem.levelUp(character, 'pow', null);

  expect(character.expToNextLevel).not.toBe(initialExpToNextLevel);
  expect(character.expToNextLevel).toBeCloseTo(Math.exp(character.level), 5);
});

test('levelUp: Recalculates maxHp when vit is increased (chosen stat)', () => {
  const character = createTestCharacter();
  const initialMaxHp = character.maxHp;
  const initialVit = character.stats.vit;

  levelingSystem.levelUp(character, 'vit', null);

  const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 1, character.vitHpMultiplier);
  expect(character.maxHp).toBe(expectedMaxHp);
  expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier);
});

test('levelUp: Recalculates maxHp when vit is increased (random stat)', () => {
  const character = createTestCharacter();
  const initialMaxHp = character.maxHp;
  const initialVit = character.stats.vit;

  levelingSystem.levelUp(character, null, 'vit');

  const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 1, character.vitHpMultiplier);
  expect(character.maxHp).toBe(expectedMaxHp);
  expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier);
});

test('levelUp: Does not recalculate maxHp when other stats are increased', () => {
  const character = createTestCharacter();
  const initialMaxHp = character.maxHp;

  levelingSystem.levelUp(character, 'pow', 'spd');

  expect(character.maxHp).toBe(initialMaxHp);
});

test('levelUp: Handles null for both chosen and random stats', () => {
  const character = createTestCharacter();
  const initialPow = character.stats.pow;
  const initialVit = character.stats.vit;
  const initialSpd = character.stats.spd;
  const initialLevel = character.level;

  levelingSystem.levelUp(character, null, null);

  expect(character.stats.pow).toBe(initialPow);
  expect(character.stats.vit).toBe(initialVit);
  expect(character.stats.spd).toBe(initialSpd);
  expect(character.level).toBe(initialLevel + 1);
});

test('levelUp: Recalculates maxHp when both chosen and random are vit', () => {
  const character = createTestCharacter();
  const initialMaxHp = character.maxHp;
  const initialVit = character.stats.vit;

  levelingSystem.levelUp(character, 'vit', 'vit');

  // VIT increased by 2
  const expectedMaxHp = calculateMaxHp(character.baseHp, initialVit + 2, character.vitHpMultiplier);
  expect(character.maxHp).toBe(expectedMaxHp);
  expect(character.maxHp).toBe(initialMaxHp + character.vitHpMultiplier * 2);
});

test('levelUp: Returns the modified character', () => {
  const character = createTestCharacter();
  const result = levelingSystem.levelUp(character, 'pow', null);

  expect(result).toBe(character);
});
