import { expect, test, describe } from 'vitest';
import * as rpg from './rpg-calculations';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { createEmptyLootTable } from '~/types/loot';
import { GUARD_DECAY_RATE, GUARD_MAX, MAX_COMBO_MULTIPLIER, POW_DAMAGE_PERCENT_PER_POINT } from '~/constants/battle';
import { ENEMY_EXP_FLAT } from '~/constants/progression';

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
  currentLevelExp: 100,
  unlockedSkillIds: ['warrior-smash'],
  selectedSkillId: 'warrior-smash',
  unlockedPassiveIds: [],
  skillLevels: {},
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
  lootTable: createEmptyLootTable(),
  expReward: 10,
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
      maxHp: 50 + 20 * 6, // 170
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
    expect(result).toBe(140); // 100 * (1 + 20*2/100) = 100 * 1.4 = 140
  });

  test('calculateDamage: Zero power', () => {
    const result = rpg.calculateDamage(100, 0);
    expect(result).toBe(100);
  });

  test('calculateDamage: High power', () => {
    const result = rpg.calculateDamage(100, 100);
    expect(result).toBe(300); // 100 * (1 + 100*2/100) = 100 * 3 = 300
  });

  test('calculateDamage: Floors decimal results', () => {
    const result = rpg.calculateDamage(15, 15);
    expect(result).toBe(19); // 15 * 1.3 = 19.5 -> 19
  });

  test('calculateDamage: scales with POW_DAMAGE_PERCENT_PER_POINT', () => {
    // Guards the tunable against silent drift: the POW term is exactly this coefficient.
    const bonus = rpg.calculateDamage(100, 10) - 100;
    expect(bonus).toBe(10 * POW_DAMAGE_PERCENT_PER_POINT);
  });

  test('calculateCharacterDamage: Uses character POW', () => {
    const result = rpg.calculateCharacterDamage(mockCharacter, 100);
    expect(result).toBe(140); // 100 * (1 + 20*2/100)
  });

  test('calculateEnemyDamage: Uses enemy POW and base damage', () => {
    const result = rpg.calculateEnemyDamage(mockEnemy);
    expect(result).toBe(32); // 25 * (1 + 15*2/100) = 32.5 -> 32
  });

  test('calculateEnemyExpReward: scales with max HP', () => {
    expect(rpg.calculateEnemyExpReward(400)).toBe(62); // 400/8 + 12
    expect(rpg.calculateEnemyExpReward(68)).toBe(21); // 68/8 + 12 = 20.5 -> 21
  });

  test('calculateEnemyExpReward: a tankier enemy is never worth less EXP', () => {
    // The inversion this guards: hand-authored values let a 68 HP trash mob out-earn a
    // 400 HP elite per second of fighting. Monotonicity in maxHp makes that impossible.
    let previous = -Infinity;
    for (const maxHp of [0, 50, 68, 150, 400, 1200]) {
      const reward = rpg.calculateEnemyExpReward(maxHp);
      expect(reward).toBeGreaterThanOrEqual(previous);
      previous = reward;
    }
  });

  test('calculateEnemyExpReward: even a 0 HP enemy grants the flat floor', () => {
    expect(rpg.calculateEnemyExpReward(0)).toBe(ENEMY_EXP_FLAT);
  });

  test('calculateMatchDamage: 3-match without power', () => {
    const result = rpg.calculateMatchDamage(3, 10, 0);
    expect(result).toBe(10);
  });

  test('calculateMatchDamage: 5-match multiplier', () => {
    const result = rpg.calculateMatchDamage(5, 10, 0);
    expect(result).toBe(17); // 10 * 1.7 (match size multiplier)
  });

  test('calculateMatchDamage: With power bonus', () => {
    const result = rpg.calculateMatchDamage(3, 10, 20);
    expect(result).toBe(14); // 10 * 1 * 1.4 = 14
  });

  test('calculateMatchMultiplier returns correct multipliers', () => {
    // Normal cases
    expect(rpg.calculateMatchMultiplier(3)).toBe(1); // 3-match: 1x
    expect(rpg.calculateMatchMultiplier(4)).toBe(1.5); // 4-match: 1.5x
    expect(rpg.calculateMatchMultiplier(5)).toBe(1.7); // 5-match: 1.7x

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
    expect(result).toBe(23); // (10 * 1.7) * (1 + 20*2/100) = 23.8 -> 23
  });
});

// ============================================================================
// Cascade Combo Calculations
// ============================================================================

describe('Cascade Combo Calculations', () => {
  test('calculateComboMultiplier: cascade level 0 is always 1x', () => {
    expect(rpg.calculateComboMultiplier(0)).toBe(1);
    expect(rpg.calculateComboMultiplier(0, 0.05)).toBe(1); // equipment bonus ignored at level 0
  });

  test('calculateComboMultiplier: negative level clamps to 1x', () => {
    expect(rpg.calculateComboMultiplier(-1)).toBe(1);
  });

  test('calculateComboMultiplier: scales on a diminishing (sqrt) curve', () => {
    // 1 + 0.35 * sqrt(level)
    expect(rpg.calculateComboMultiplier(1)).toBeCloseTo(1.35, 5);
    expect(rpg.calculateComboMultiplier(2)).toBeCloseTo(1.4949747, 5);
    expect(rpg.calculateComboMultiplier(4)).toBeCloseTo(1.7, 5);
    // Each extra level adds less than the previous one (diminishing returns)
    const d1 = rpg.calculateComboMultiplier(2) - rpg.calculateComboMultiplier(1);
    const d2 = rpg.calculateComboMultiplier(3) - rpg.calculateComboMultiplier(2);
    expect(d2).toBeLessThan(d1);
  });

  test('calculateComboMultiplier: never exceeds MAX_COMBO_MULTIPLIER', () => {
    expect(rpg.calculateComboMultiplier(50)).toBe(MAX_COMBO_MULTIPLIER);
    expect(rpg.calculateComboMultiplier(9999, 0.5)).toBe(MAX_COMBO_MULTIPLIER);
  });

  test('calculateComboMultiplier: equipment bonus raises the curve coefficient', () => {
    // 1 + (0.35 + 0.02) * sqrt(1)
    expect(rpg.calculateComboMultiplier(1, 0.02)).toBeCloseTo(1.37, 5);
    // Equipment makes a given cascade level hit harder (still capped)
    expect(rpg.calculateComboMultiplier(2, 0.1)).toBeGreaterThan(rpg.calculateComboMultiplier(2));
  });

  test('calculateMatchDamage: comboMultiplier defaults to 1 (existing behavior unchanged)', () => {
    expect(rpg.calculateMatchDamage(3, 10, 0)).toBe(10);
    expect(rpg.calculateMatchDamage(5, 10, 0)).toBe(17);
  });

  test('calculateMatchDamage: applies combo multiplier without power', () => {
    // 3-match (1x) * 1.25 combo * baseDamage 10 = 12.5 -> floor 12
    expect(rpg.calculateMatchDamage(3, 10, 0, 1.25)).toBe(12);
  });

  test('calculateMatchDamage: applies combo multiplier with power', () => {
    // 3-match (1x) * 1.5 combo * 10 = 15, then calculateDamage(15, 20) = floor(21) = 21
    expect(rpg.calculateMatchDamage(3, 10, 20, 1.5)).toBe(21);
  });

  test('calculateMatchDamage: combo applies on top of the match-size multiplier', () => {
    // 6-match (2x) * 1.25 combo * 10 = 25
    expect(rpg.calculateMatchDamage(6, 10, 0, 1.25)).toBe(25);
  });
});

// ============================================================================
// Skill Damage Calculations
// ============================================================================

describe('Skill Damage Calculations', () => {
  test('Warrior Power Strike: 3x multiplier, 10 flat bonus', () => {
    // baseDamage=15, pow=15, multiplier=3, flat=10
    // scaledBase = |15 * 3| = 45
    // calculateDamage(45, 15) = floor(45 * 130 / 100) = floor(58.5) = 58
    // total = 58 + 10 = 68
    const result = rpg.calculateSkillDamage(15, 15, 3, 10);
    expect(result).toBe(68);
  });

  test('Rogue Assassinate: 1x multiplier, 30 flat bonus', () => {
    // baseDamage=15, pow=20, multiplier=1, flat=30
    // scaledBase = |15 * 1| = 15
    // calculateDamage(15, 20) = floor(15 * 140 / 100) = floor(21) = 21
    // total = 21 + 30 = 51
    const result = rpg.calculateSkillDamage(15, 20, 1, 30);
    expect(result).toBe(51);
  });

  test('Mage Arcane Blast: 5x multiplier, no flat bonus', () => {
    // baseDamage=15, pow=25, multiplier=5, flat=0
    // scaledBase = |15 * 5| = 75
    // calculateDamage(75, 25) = floor(75 * 150 / 100) = floor(112.5) = 112
    // total = 112 + 0 = 112
    const result = rpg.calculateSkillDamage(15, 25, 5, 0);
    expect(result).toBe(112);
  });

  test('Healer Divine Heal: 4x multiplier (heal amount)', () => {
    // baseDamage=15, pow=10, multiplier=4, flat=0
    // scaledBase = |15 * 4| = 60
    // calculateDamage(60, 10) = floor(60 * 120 / 100) = floor(72) = 72
    // total = 72 + 0 = 72
    const result = rpg.calculateSkillDamage(15, 10, 4, 0);
    expect(result).toBe(72);
  });

  test('Zero POW returns base scaled damage + flat bonus', () => {
    const result = rpg.calculateSkillDamage(15, 0, 2, 10);
    // scaledBase = 30, calculateDamage(30, 0) = 30, total = 30 + 10 = 40
    expect(result).toBe(40);
  });

  test('Zero multiplier returns only flat bonus', () => {
    const result = rpg.calculateSkillDamage(15, 20, 0, 30);
    // scaledBase = 0, calculateDamage(0, 20) = 0, total = 0 + 30 = 30
    expect(result).toBe(30);
  });

  test('High POW scales significantly', () => {
    const result = rpg.calculateSkillDamage(15, 100, 2, 0);
    // scaledBase = 30, calculateDamage(30, 100) = floor(30 * 300 / 100) = 90
    expect(result).toBe(90);
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

  test('calculateSkillCooldown: Base calculation', () => {
    const result = rpg.calculateSkillCooldown(3, 20);
    expect(result).toBe(2.5); // 3 / (1 + 20/100) = 3 / 1.2 = 2.5
  });

  test('calculateSkillCooldown: Zero speed', () => {
    const result = rpg.calculateSkillCooldown(3, 0);
    expect(result).toBe(3);
  });

  test('calculateSkillCooldownFillRate: Calculates per-second rate', () => {
    const result = rpg.calculateSkillCooldownFillRate(2, 0);
    expect(result).toBe(0.5); // 1/2 = 0.5 fills per second
  });

  test('calculateSkillCooldownFillRate: With speed bonus', () => {
    const result = rpg.calculateSkillCooldownFillRate(2, 100);
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
// Stagger (Flinch) Calculations
// ============================================================================

describe('Stagger Calculations', () => {
  test('calculateStaggerPushMs: any real hit produces a positive push (everyone flinches)', () => {
    expect(rpg.calculateStaggerPushMs(50, 300, 50, 4000)).toBeGreaterThan(0);
    // Even a tiny hit on a very tanky enemy still flinches a little.
    expect(rpg.calculateStaggerPushMs(1, 9999, 999, 4000)).toBeGreaterThan(0);
  });

  test('calculateStaggerPushMs: zero/negative damage or interval yields no push', () => {
    expect(rpg.calculateStaggerPushMs(0, 300, 50, 4000)).toBe(0);
    expect(rpg.calculateStaggerPushMs(-10, 300, 50, 4000)).toBe(0);
    expect(rpg.calculateStaggerPushMs(50, 300, 50, 0)).toBe(0);
  });

  test('calculateStaggerPushMs: higher VIT resists (smaller push), monotonically', () => {
    const lowVit = rpg.calculateStaggerPushMs(50, 300, 10, 4000);
    const midVit = rpg.calculateStaggerPushMs(50, 300, 50, 4000);
    const highVit = rpg.calculateStaggerPushMs(50, 300, 100, 4000);
    expect(midVit).toBeLessThan(lowVit);
    expect(highVit).toBeLessThan(midVit);
  });

  test('calculateStaggerPushMs: scales with damage up to the reference, then plateaus', () => {
    const small = rpg.calculateStaggerPushMs(10, 300, 50, 4000);
    const bigger = rpg.calculateStaggerPushMs(40, 300, 50, 4000);
    expect(bigger).toBeGreaterThan(small);
    // reference = 300 * 0.15 = 45; hits at or above 45 all reach damageRatio = 1 and plateau.
    const atReference = rpg.calculateStaggerPushMs(45, 300, 50, 4000);
    const wayAbove = rpg.calculateStaggerPushMs(9999, 300, 50, 4000);
    expect(wayAbove).toBeCloseTo(atReference, 5);
  });

  test('clampStaggerToCycleBudget: a single push never exceeds the per-cycle cap', () => {
    // cap = 4000 * 0.12 = 480ms
    expect(rpg.clampStaggerToCycleBudget(10_000, 4000, 0)).toBe(480);
  });

  test('clampStaggerToCycleBudget: respects budget already spent, then zeroes out', () => {
    expect(rpg.clampStaggerToCycleBudget(1000, 4000, 300)).toBe(180); // 480 cap - 300 used
    expect(rpg.clampStaggerToCycleBudget(1000, 4000, 480)).toBe(0);
    expect(rpg.clampStaggerToCycleBudget(1000, 4000, 600)).toBe(0); // over-spent stays clamped
  });

  test('anti-stunlock: relentless huge hits can never push a cycle past the cap', () => {
    const interval = 4000;
    let used = 0;
    for (let i = 0; i < 25; i++) {
      const push = rpg.calculateStaggerPushMs(9999, 300, 50, interval);
      used += rpg.clampStaggerToCycleBudget(push, interval, used);
    }
    expect(used).toBeLessThanOrEqual(interval * 0.12 + 1e-9);
  });
});

// ============================================================================
// HP Threshold
// ============================================================================

// Cutoffs are hardcoded rather than imported so a rebalance of getHpThreshold
// has to update these deliberately instead of silently redefining the boundary.
describe('HP Threshold', () => {
  test('getHpThreshold: Returns high above 55%', () => {
    expect(rpg.getHpThreshold(100)).toBe('high');
    expect(rpg.getHpThreshold(75)).toBe('high');
    expect(rpg.getHpThreshold(56)).toBe('high');
  });

  test('getHpThreshold: Returns medium between 30% (exclusive) and 55% (inclusive)', () => {
    expect(rpg.getHpThreshold(55)).toBe('medium');
    expect(rpg.getHpThreshold(40)).toBe('medium');
    expect(rpg.getHpThreshold(31)).toBe('medium');
  });

  test('getHpThreshold: Returns low at 30% and below', () => {
    expect(rpg.getHpThreshold(30)).toBe('low');
    expect(rpg.getHpThreshold(10)).toBe('low');
    expect(rpg.getHpThreshold(0)).toBe('low');
  });

  test('getHpThreshold: High/medium boundary sits exactly at 55', () => {
    expect(rpg.getHpThreshold(55.01)).toBe('high');
    expect(rpg.getHpThreshold(55)).toBe('medium');
    expect(rpg.getHpThreshold(54.99)).toBe('medium');
  });

  test('getHpThreshold: Medium/low boundary sits exactly at 30', () => {
    expect(rpg.getHpThreshold(30.01)).toBe('medium');
    expect(rpg.getHpThreshold(30)).toBe('low');
    expect(rpg.getHpThreshold(29.99)).toBe('low');
  });

  test('getHpThreshold: Clamps nothing — out-of-range values still tier by cutoff', () => {
    expect(rpg.getHpThreshold(150)).toBe('high');
    expect(rpg.getHpThreshold(-10)).toBe('low');
  });
});

// ============================================================================
// Stat Utilities
// ============================================================================

describe('Item Cooldown', () => {
  const party: CharacterData[] = [
    { ...mockCharacter, stats: { pow: 20, vit: 15, spd: 10 } },
    { ...mockCharacter, id: 'c2', stats: { pow: 10, vit: 10, spd: 20 } },
    { ...mockCharacter, id: 'c3', stats: { pow: 5, vit: 5, spd: 30 } },
  ];

  test('calculatePartyCollectiveSpd: Sums SPD across party', () => {
    expect(rpg.calculatePartyCollectiveSpd(party)).toBe(60);
  });

  test('calculatePartyCollectiveSpd: Empty party returns 0', () => {
    expect(rpg.calculatePartyCollectiveSpd([])).toBe(0);
  });

  test('calculateItemCooldownInMs: Reduces cooldown with higher SPD', () => {
    const result = rpg.calculateItemCooldownInMs(party);
    expect(result).toBe(6250); // floor(10000 / (1 + 60/100)) = floor(10000/1.6) = 6250
  });

  test('calculateItemCooldownInMs: Zero SPD returns base cooldown', () => {
    const zeroSpdParty = [{ ...mockCharacter, stats: { pow: 0, vit: 0, spd: 0 } }];
    expect(rpg.calculateItemCooldownInMs(zeroSpdParty)).toBe(10000);
  });

  test('calculateItemCooldownInMs: Flat bonus SPD (passive) shortens the cooldown', () => {
    const zeroSpdParty = [{ ...mockCharacter, stats: { pow: 0, vit: 0, spd: 0 } }];
    // +10 effective SPD: floor(10000 / 1.1) = 9090
    expect(rpg.calculateItemCooldownInMs(zeroSpdParty, 10)).toBe(9090);
    expect(rpg.calculateItemCooldownInMs(zeroSpdParty, 10)).toBeLessThan(
      rpg.calculateItemCooldownInMs(zeroSpdParty),
    );
  });
});

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

// ============================================================================
// Guard Calculations
// ============================================================================

describe('Guard Calculations', () => {
  function partyWithSpds(spds: number[], hps?: number[]): CharacterData[] {
    return spds.map((spd, i) => ({
      ...mockCharacter,
      id: `char-${i}`,
      stats: { ...mockCharacter.stats, spd },
      currentHp: hps ? hps[i] : mockCharacter.maxHp,
    }));
  }

  function partyWithVits(vits: number[], hps?: number[]): CharacterData[] {
    return vits.map((vit, i) => ({
      ...mockCharacter,
      id: `char-${i}`,
      stats: { ...mockCharacter.stats, vit },
      currentHp: hps ? hps[i] : mockCharacter.maxHp,
    }));
  }

  test('calculateGuardChargeRate: returns >= 1 and >= 1 at zero SPD', () => {
    expect(rpg.calculateGuardChargeRate(partyWithSpds([0, 0]))).toBe(1);
    expect(rpg.calculateGuardChargeRate(partyWithSpds([10, 20]))).toBeGreaterThan(1);
  });

  test('calculateGuardChargeRate: monotonic — more SPD never charges slower', () => {
    const low = rpg.calculateGuardChargeRate(partyWithSpds([10, 10]));
    const high = rpg.calculateGuardChargeRate(partyWithSpds([40, 40]));
    expect(high).toBeGreaterThan(low);
  });

  test('calculateGuardChargeRate: diminishing — doubling SPD less than doubles the bonus', () => {
    const bonusAt = (spd: number) => rpg.calculateGuardChargeRate(partyWithSpds([spd])) - 1;
    expect(bonusAt(100)).toBeLessThan(bonusAt(25) * 4);
  });

  test('calculateGuardChargeRate: ignores dead members', () => {
    const allAlive = rpg.calculateGuardChargeRate(partyWithSpds([20, 20]));
    const oneDead = rpg.calculateGuardChargeRate(partyWithSpds([20, 20], [100, 0]));
    expect(oneDead).toBeLessThan(allAlive);
  });

  test('calculateGuardChargeRate: clamps negative collective SPD (no NaN from negative-SPD gear)', () => {
    const result = rpg.calculateGuardChargeRate(partyWithSpds([-10, -20]));
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(1); // sqrt(max(0, -30)) = 0 -> charge rate 1
  });

  test('resolveGuardedDamage: empty bar lets full damage through', () => {
    const r = rpg.resolveGuardedDamage(25, 0);
    expect(r.damageTaken).toBe(25);
    expect(r.guardAfter).toBe(0);
    expect(r.wasFullBlock).toBe(false);
  });

  test('resolveGuardedDamage: full bar fully blocks (guardBreak 1), drains half', () => {
    const r = rpg.resolveGuardedDamage(25, GUARD_MAX, 1);
    expect(r.damageTaken).toBe(0);
    expect(r.wasFullBlock).toBe(true);
    expect(r.guardAfter).toBe(50); // 100 - 1 * 0.5 * 100 * 1
  });

  test('resolveGuardedDamage: guardBreak 2 still fully blocks but empties the bar', () => {
    const r = rpg.resolveGuardedDamage(25, GUARD_MAX, 2);
    expect(r.damageTaken).toBe(0);
    expect(r.wasFullBlock).toBe(true);
    expect(r.guardAfter).toBe(0); // 100 - 1 * 0.5 * 100 * 2 = 0 (floored)
  });

  test('resolveGuardedDamage: guardBreak 0.5 fully blocks and barely dents', () => {
    const r = rpg.resolveGuardedDamage(25, GUARD_MAX, 0.5);
    expect(r.damageTaken).toBe(0);
    expect(r.guardAfter).toBe(75); // 100 - 1 * 0.5 * 100 * 0.5
  });

  test('resolveGuardedDamage: half bar mitigates ~50%', () => {
    const r = rpg.resolveGuardedDamage(25, GUARD_MAX / 2, 1);
    expect(r.damageTaken).toBe(13); // round(25 * 0.5)
    expect(r.guardAfter).toBe(25); // 50 - 0.5 * 0.5 * 100 * 1 = 50 - 25
    expect(r.wasFullBlock).toBe(false);
  });

  test('resolveGuardedDamage: is magnitude-independent (same % behavior at 25 and 2500)', () => {
    const small = rpg.resolveGuardedDamage(25, GUARD_MAX / 2, 1);
    const large = rpg.resolveGuardedDamage(2500, GUARD_MAX / 2, 1);
    // Same mitigation fraction → same guard drain regardless of hit size
    expect(large.guardAfter).toBe(small.guardAfter);
    expect(large.damageTaken).toBe(1250); // exactly 50% of 2500
    expect(small.damageTaken).toBe(13); // round(50% of 25)
  });

  test('decayGuard: bleeds proportionally to fill and floors at 0', () => {
    expect(rpg.decayGuard(GUARD_MAX, 1)).toBe(GUARD_MAX - GUARD_DECAY_RATE);
    // 20% fill decays ~20% as fast as a full bar
    const fullDrop = GUARD_MAX - rpg.decayGuard(GUARD_MAX, 1);
    const lowDrop = GUARD_MAX * 0.2 - rpg.decayGuard(GUARD_MAX * 0.2, 1);
    expect(lowDrop).toBeCloseTo(fullDrop * 0.2, 5);
    expect(rpg.decayGuard(0, 5)).toBe(0);
  });

  test('decayGuard: actually reaches exactly 0 (bleed is asymptotic without the snap)', () => {
    // Regression guard: proportional decay only approaches 0, so without GUARD_MIN_THRESHOLD the
    // meter ticks forever and every Guard subscriber re-renders for the rest of the battle.
    let guard = GUARD_MAX;
    for (let i = 0; i < 10_000 && guard > 0; i++) {
      guard = rpg.decayGuard(guard, 0.1);
    }
    expect(guard).toBe(0);
  });

  test('decayGuard: resistance slows the bleed proportionally', () => {
    const normal = GUARD_MAX - rpg.decayGuard(GUARD_MAX, 1);
    const resisted = GUARD_MAX - rpg.decayGuard(GUARD_MAX, 1, 0.5);
    expect(resisted).toBeCloseTo(normal * 0.5, 5);
  });

  test('calculateGuardDecayResistance: 1 at zero VIT, and within (0, 1] otherwise', () => {
    expect(rpg.calculateGuardDecayResistance(partyWithVits([0, 0]))).toBe(1);
    const resisted = rpg.calculateGuardDecayResistance(partyWithVits([30, 40]));
    expect(resisted).toBeLessThan(1);
    expect(resisted).toBeGreaterThan(0);
  });

  test('calculateGuardDecayResistance: monotonic — more VIT never decays faster', () => {
    const low = rpg.calculateGuardDecayResistance(partyWithVits([10, 10]));
    const high = rpg.calculateGuardDecayResistance(partyWithVits([40, 40]));
    expect(high).toBeLessThan(low);
  });

  test('calculateGuardDecayResistance: diminishing — doubling VIT less than doubles the reduction', () => {
    const reductionAt = (vit: number) => 1 - rpg.calculateGuardDecayResistance(partyWithVits([vit]));
    expect(reductionAt(200)).toBeLessThan(reductionAt(100) * 2);
  });

  test('calculateGuardDecayResistance: ignores dead members (a dying party bleeds faster)', () => {
    const allAlive = rpg.calculateGuardDecayResistance(partyWithVits([20, 20]));
    const oneDead = rpg.calculateGuardDecayResistance(partyWithVits([20, 20], [100, 0]));
    expect(oneDead).toBeGreaterThan(allAlive);
  });

  test('calculateGuardDecayResistance: clamps negative collective VIT (no inverted decay)', () => {
    const result = rpg.calculateGuardDecayResistance(partyWithVits([-10, -20]));
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(1); // max(0, -30) = 0 -> no resistance, never negative
  });
});
