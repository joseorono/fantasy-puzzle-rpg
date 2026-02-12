import { bench, describe } from 'vitest';
import { calculateExpToNextLevel, getRandomPotentialStats, levelUp } from './leveling-system';
import type { CharacterData, CoreRPGStats } from '~/types';

const createTestCharacter = (): CharacterData => ({
  id: 'test-char-1',
  name: 'Test Hero',
  class: 'warrior',
  color: 'blue',
  baseHp: 100,
  maxHp: 120,
  currentHp: 120,
  stats: { pow: 10, vit: 4, spd: 5 },
  potentialStats: { pow: 50, vit: 30, spd: 40 },
  vitHpMultiplier: 5,
  skillCooldown: 0,
  maxCooldown: 10,
  level: 1,
  expToNextLevel: 1,
});

const chosenStat: CoreRPGStats = { pow: 1, vit: 1, spd: 0 };
const randomStats: CoreRPGStats = { pow: 1, vit: 0, spd: 1 };

describe('calculateExpToNextLevel', () => {
  bench('level 1', () => {
    calculateExpToNextLevel(1);
  });

  bench('level 10', () => {
    calculateExpToNextLevel(10);
  });

  bench('level 50', () => {
    calculateExpToNextLevel(50);
  });
});

describe('getRandomPotentialStats', () => {
  bench('1 stat increase (includes setup)', () => {
    const potentialStats = { pow: 50, vit: 30, spd: 40 };
    getRandomPotentialStats(potentialStats, 1);
  });

  bench('3 stat increases (includes setup)', () => {
    const potentialStats = { pow: 50, vit: 30, spd: 40 };
    getRandomPotentialStats(potentialStats, 3);
  });
});

describe('levelUp', () => {
  bench('level up with chosen stat only (includes setup)', () => {
    const character = createTestCharacter();
    levelUp(character, chosenStat, null, 1);
  });

  bench('level up with chosen + random stats (includes setup)', () => {
    const character = createTestCharacter();
    levelUp(character, chosenStat, randomStats, 1);
  });

  bench('level up x3 (includes setup)', () => {
    const character = createTestCharacter();
    levelUp(character, chosenStat, randomStats, 3);
  });
});
