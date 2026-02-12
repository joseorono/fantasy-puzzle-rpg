import { bench, describe } from 'vitest';
import {
  calculateMaxHp,
  calculateEntityMaxHp,
  calculatePartyMaxHp,
  calculatePartyCurrentHp,
  calculatePartyHpPercentage,
  calculateDamage,
  calculateSkillDamage,
  calculateCharacterDamage,
  calculateEnemyDamage,
  calculateMatchMultiplier,
  calculateMatchDamage,
  calculateAttackInterval,
  calculateSkillCooldown,
  calculateSkillCooldownFillRate,
  calculateEnemyAttackInterval,
  calculateCharacterCooldown,
  calculatePartyCollectiveSpd,
  calculateItemCooldownInMs,
  getHpThreshold,
  createStats,
  validateStats,
} from './rpg-calculations';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';

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
  sprite: '',
  attackInterval: 4000,
  attackDamage: 25,
};

const threeCharParty: CharacterData[] = [
  { ...mockCharacter, id: 'c1', currentHp: 50, maxHp: 100 },
  { ...mockCharacter, id: 'c2', currentHp: 30, maxHp: 80 },
  { ...mockCharacter, id: 'c3', currentHp: 100, maxHp: 120 },
];

// ── HP Calculations ──

describe('HP Calculations', () => {
  bench('calculateMaxHp', () => {
    calculateMaxHp(100, 10, 5);
  });

  bench('calculateEntityMaxHp (character)', () => {
    calculateEntityMaxHp(mockCharacter);
  });

  bench('calculateEntityMaxHp (enemy)', () => {
    calculateEntityMaxHp(mockEnemy);
  });

  bench('calculatePartyMaxHp (3 members)', () => {
    calculatePartyMaxHp(threeCharParty);
  });

  bench('calculatePartyCurrentHp (3 members)', () => {
    calculatePartyCurrentHp(threeCharParty);
  });

  bench('calculatePartyHpPercentage (3 members)', () => {
    calculatePartyHpPercentage(threeCharParty);
  });
});

// ── Damage Calculations ──

describe('Damage Calculations', () => {
  bench('calculateDamage', () => {
    calculateDamage(100, 20);
  });

  bench('calculateSkillDamage', () => {
    calculateSkillDamage(15, 25, 3, 0);
  });

  bench('calculateCharacterDamage', () => {
    calculateCharacterDamage(mockCharacter, 100);
  });

  bench('calculateEnemyDamage', () => {
    calculateEnemyDamage(mockEnemy);
  });

  bench('calculateMatchMultiplier (3-match)', () => {
    calculateMatchMultiplier(3);
  });

  bench('calculateMatchMultiplier (6-match)', () => {
    calculateMatchMultiplier(6);
  });

  bench('calculateMatchDamage (3-match, no POW)', () => {
    calculateMatchDamage(3, 10, 0);
  });

  bench('calculateMatchDamage (5-match, with POW)', () => {
    calculateMatchDamage(5, 10, 20);
  });
});

// ── Speed Calculations ──

describe('Speed Calculations', () => {
  bench('calculateAttackInterval', () => {
    calculateAttackInterval(4000, 20);
  });

  bench('calculateSkillCooldown', () => {
    calculateSkillCooldown(3, 20);
  });

  bench('calculateSkillCooldownFillRate', () => {
    calculateSkillCooldownFillRate(2, 100);
  });

  bench('calculateEnemyAttackInterval', () => {
    calculateEnemyAttackInterval(mockEnemy);
  });

  bench('calculateCharacterCooldown', () => {
    calculateCharacterCooldown(mockCharacter);
  });
});

// ── Item Cooldown ──

describe('Item Cooldown', () => {
  bench('calculatePartyCollectiveSpd (3 members)', () => {
    calculatePartyCollectiveSpd(threeCharParty);
  });

  bench('calculateItemCooldownInMs (3 members)', () => {
    calculateItemCooldownInMs(threeCharParty);
  });
});

// ── HP Threshold ──

describe('HP Threshold', () => {
  bench('getHpThreshold (high)', () => {
    getHpThreshold(75);
  });

  bench('getHpThreshold (low)', () => {
    getHpThreshold(10);
  });
});

// ── Stat Utilities ──

describe('Stat Utilities', () => {
  bench('createStats', () => {
    createStats(10, 20, 30);
  });

  bench('validateStats (valid)', () => {
    validateStats({ pow: 10, vit: 20, spd: 30 });
  });

  bench('validateStats (invalid)', () => {
    validateStats({ pow: -1, vit: 20, spd: 30 });
  });
});
