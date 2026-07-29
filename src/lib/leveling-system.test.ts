import { describe, it, expect } from 'vitest';
import * as levelingSystem from './leveling-system';
import { calculateMaxHp } from './rpg-calculations';
import { calculateLevelUpsForParty } from './battle-rewards';
import { MAX_LEVEL, MAX_LEVEL_UPS_PER_BATTLE } from '~/constants/party';
import { EXP_BASE, EXP_CURVE_POWER } from '~/constants/progression';
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
  currentLevelExp: 0,
  unlockedSkillIds: ['warrior-smash'],
  selectedSkillId: 'warrior-smash',
  unlockedPassiveIds: [],
  ...overrides,
});

describe('getRandomPotentialStats', () => {
  it('should return zeroed stats when statAmountToIncrease is 0', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character.potentialStats, 0);
    expect(result).toEqual({ pow: 0, vit: 0, spd: 0 });
  });

  it('should return zeroed stats when no potential stats available', () => {
    const character = createTestCharacter({
      potentialStats: { pow: 0, vit: 0, spd: 0 },
    });
    const result = levelingSystem.getRandomPotentialStats(character.potentialStats, 1);
    expect(result).toEqual({ pow: 0, vit: 0, spd: 0 });
  });

  it('should return stat increases object with correct total', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character.potentialStats, 1);

    expect(result).toHaveProperty('pow');
    expect(result).toHaveProperty('vit');
    expect(result).toHaveProperty('spd');
    const totalIncrease = result.pow + result.vit + result.spd;
    expect(totalIncrease).toBe(1);
  });

  it('should distribute multiple stat increases', () => {
    const character = createTestCharacter();
    const result = levelingSystem.getRandomPotentialStats(character.potentialStats, 3);

    const totalIncrease = result.pow + result.vit + result.spd;
    expect(totalIncrease).toBe(3);
  });

  it('should only use stats with available potential', () => {
    const character = createTestCharacter({
      potentialStats: { pow: 0, vit: 20, spd: 0 },
    });
    const result = levelingSystem.getRandomPotentialStats(character.potentialStats, 1);

    expect(result.vit).toBe(1);
    expect(result.pow).toBe(0);
    expect(result.spd).toBe(0);
  });

  it('should decrease potential stats', () => {
    const character = createTestCharacter();
    const initialPotential = { ...character.potentialStats };
    levelingSystem.getRandomPotentialStats(character.potentialStats, 2);

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

  it('should reset currentLevelExp to 0 after leveling (caller sets the leftover)', () => {
    const character = createTestCharacter({ currentLevelExp: 5 });
    const chosenStats: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 2);

    expect(character.currentLevelExp).toBe(0);
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

  it('should heal only up to the pre-level-up maxHp when vit is increased', () => {
    const character = createTestCharacter({ currentHp: 30 });
    const chosenStats: CoreRPGStats = { pow: 0, vit: 2, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.maxHp).toBe(130);
    expect(character.currentHp).toBe(120);
  });

  it('should fully heal when vit is not increased', () => {
    const character = createTestCharacter({ currentHp: 30 });
    const chosenStats: CoreRPGStats = { pow: 2, vit: 0, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.maxHp).toBe(120);
    expect(character.currentHp).toBe(120);
  });

  it('should not fill the hp gained from vit when already at full hp', () => {
    const character = createTestCharacter({ currentHp: 120 });
    const chosenStats: CoreRPGStats = { pow: 0, vit: 2, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.maxHp).toBe(130);
    expect(character.currentHp).toBe(120);
  });

  it('should revive a defeated character up to the pre-level-up maxHp', () => {
    const character = createTestCharacter({ currentHp: 0 });
    const chosenStats: CoreRPGStats = { pow: 0, vit: 2, spd: 0 };

    levelingSystem.levelUp(character, chosenStats, null, 1);

    expect(character.currentHp).toBe(120);
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

describe('getExpThresholdForLevel', () => {
  it('matches the polynomial curve', () => {
    for (const level of [1, 2, 3, 4, 5, 10, 30]) {
      expect(levelingSystem.getExpThresholdForLevel(level)).toBe(Math.floor(EXP_BASE * level ** EXP_CURVE_POWER));
    }
  });

  it('pins the tuned reference points', () => {
    expect(levelingSystem.getExpThresholdForLevel(1)).toBe(12);
    expect(levelingSystem.getExpThresholdForLevel(10)).toBe(379);
    expect(levelingSystem.getExpThresholdForLevel(30)).toBe(1971);
  });

  it('grows sub-exponentially, so late levels stay reachable', () => {
    // The regression this guards: an exponential curve puts everything past ~level 10
    // out of reach at any enemy EXP value. Cumulative EXP to level 30 must stay within
    // a campaign's worth of battles.
    let cumulative = 0;
    for (let level = 1; level < 30; level++) {
      cumulative += levelingSystem.getExpThresholdForLevel(level);
    }
    expect(cumulative).toBeLessThan(30_000);
  });
});

describe('buildExpGainTimeline', () => {
  it('produces a single partial segment when no level-up occurs', () => {
    // threshold(1) = 12; gaining 6 fills to 50%.
    const character = createTestCharacter({ level: 1, currentLevelExp: 0 });
    const timeline = levelingSystem.buildExpGainTimeline(character, 6);

    expect(timeline.startLevel).toBe(1);
    expect(timeline.totalLevelUps).toBe(0);
    expect(timeline.segments).toHaveLength(1);
    expect(timeline.segments[0]).toMatchObject({ level: 1, fromPercent: 0, toPercent: 50, levelsUp: false });
  });

  it('emits a static segment when no exp is gained', () => {
    const character = createTestCharacter({ level: 1, currentLevelExp: 6 });
    const timeline = levelingSystem.buildExpGainTimeline(character, 0);

    expect(timeline.totalLevelUps).toBe(0);
    expect(timeline.segments).toHaveLength(1);
    // threshold(1) = 12; sitting at 6/12 = 50%, no movement.
    expect(timeline.segments[0]).toMatchObject({ fromPercent: 50, toPercent: 50, levelsUp: false });
  });

  it('fills to 100% and resets to 0% when exactly hitting a threshold', () => {
    // threshold(1) = 12; gaining exactly 12 clears level 1.
    const character = createTestCharacter({ level: 1, currentLevelExp: 0 });
    const timeline = levelingSystem.buildExpGainTimeline(character, 12);

    expect(timeline.totalLevelUps).toBe(1);
    expect(timeline.segments).toHaveLength(2);
    expect(timeline.segments[0]).toMatchObject({ level: 1, fromPercent: 0, toPercent: 100, levelsUp: true });
    // After the level-up the bar starts the next level at 0%.
    expect(timeline.segments[1]).toMatchObject({ level: 2, fromPercent: 0, toPercent: 0, levelsUp: false });
  });

  it('emits one levelsUp segment per level on a multi-level gain', () => {
    // threshold(1) = 12, threshold(2) = 33; gaining 45 clears two levels.
    const character = createTestCharacter({ level: 1, currentLevelExp: 0 });
    const timeline = levelingSystem.buildExpGainTimeline(character, 45);

    expect(timeline.totalLevelUps).toBe(2);
    const levelUpSegments = timeline.segments.filter((s) => s.levelsUp);
    expect(levelUpSegments).toHaveLength(2);
    expect(levelUpSegments.map((s) => s.level)).toEqual([1, 2]);
  });

  it('agrees with calculateLevelUpsForParty on the total level-up count', () => {
    for (const { level, progress, gained } of [
      { level: 1, progress: 0, gained: 1 },
      { level: 1, progress: 0, gained: 12 },
      { level: 1, progress: 0, gained: 45 },
      { level: 2, progress: 3, gained: 120 },
      { level: 3, progress: 10, gained: 600 },
    ]) {
      const preBattle = createTestCharacter({ level, currentLevelExp: progress });
      const timeline = levelingSystem.buildExpGainTimeline(preBattle, gained);

      // calculateLevelUpsForParty expects members whose currentLevelExp already includes the reward.
      const postBattle = createTestCharacter({ level, currentLevelExp: progress + gained });
      const [pending] = calculateLevelUpsForParty([postBattle], gained);

      expect(timeline.totalLevelUps).toBe(pending.pendingLevelUps);
    }
  });

  it('caps the final level at MAX_LEVEL for runaway EXP (no infinite loop)', () => {
    // Infinity EXP keeps expProgress >= threshold forever; the level ceiling must halt
    // the loop so the character lands exactly on MAX_LEVEL.
    const startLevel = 1;
    const character = createTestCharacter({ level: startLevel, currentLevelExp: 1 });
    const [pending] = calculateLevelUpsForParty([character], Infinity);

    expect(startLevel + pending.pendingLevelUps).toBe(MAX_LEVEL);
    expect(pending.pendingLevelUps).toBeLessThanOrEqual(MAX_LEVEL_UPS_PER_BATTLE);
  });
});

describe('getTotalExpToReachLevel', () => {
  it('costs nothing to reach the level you already start on, or below', () => {
    expect(levelingSystem.getTotalExpToReachLevel(1)).toBe(0);
    expect(levelingSystem.getTotalExpToReachLevel(0)).toBe(0);
    expect(levelingSystem.getTotalExpToReachLevel(-5)).toBe(0);
  });

  it('reaching level 2 costs exactly the level 1 threshold', () => {
    expect(levelingSystem.getTotalExpToReachLevel(2)).toBe(levelingSystem.getExpThresholdForLevel(1));
  });

  it('sums every threshold below the target', () => {
    const target = 16;
    let expected = 0;
    for (let level = 1; level < target; level += 1) {
      expected += levelingSystem.getExpThresholdForLevel(level);
    }

    expect(levelingSystem.getTotalExpToReachLevel(target)).toBe(expected);
  });

  it('clamps to MAX_LEVEL rather than growing past the level ceiling', () => {
    expect(levelingSystem.getTotalExpToReachLevel(MAX_LEVEL + 50)).toBe(
      levelingSystem.getTotalExpToReachLevel(MAX_LEVEL),
    );
  });

  it('actually lands a level-1 character on the target level', () => {
    // The contract the EXP piñata debug encounter depends on: award this much and the
    // character reaches exactly the target, with nothing left toward the next level.
    const target = 16;
    const character = createTestCharacter({ level: 1, currentLevelExp: 0 });
    const totalExp = levelingSystem.getTotalExpToReachLevel(target);
    const [pending] = calculateLevelUpsForParty([{ ...character, currentLevelExp: totalExp }], totalExp);

    expect(1 + pending.pendingLevelUps).toBe(target);
  });
});
