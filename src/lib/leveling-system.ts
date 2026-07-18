import type { CharacterData, CoreRPGStats, StatType } from '~/types';
import { calculateMaxHp } from './rpg-calculations';
import { LEVELING_UP_HEALS_CHARACTER, MAX_LEVEL, MAX_LEVEL_UPS_PER_BATTLE } from '~/constants/party';
/**
 * Leveling System
 *
 * This module will handle character progression and leveling mechanics.
 *
 * Planned Features:
 * - Experience points (EXP) and level progression
 * - Stat growth on level up
 * - Skill unlocks and upgrades
 *
 * Current Status: Not yet implemented
 *
 * For now, all RPG calculations are handled in rpg-calculations.ts
 */

/**
 * The EXP required to clear a single level — the threshold the game actually uses to
 * decide level-ups (see `calculateLevelUpsForParty` in `battle-rewards.ts`). Shared by
 * the level-up logic and the rewards-screen bar animation so the two can't drift.
 *
 * @param level - The character's current level
 * @returns EXP needed to advance out of that level
 */
export function getExpThresholdForLevel(level: number): number {
  return Math.floor(Math.exp(level));
}

/** One step of the rewards-screen EXP bar animation (a single level the bar passes through). */
export interface ExpGainSegment {
  /** Level shown while this segment fills. */
  level: number;
  /** Starting fill of the bar for this segment (0–100). */
  fromPercent: number;
  /** Ending fill of the bar for this segment (0–100; 100 when the character levels up). */
  toPercent: number;
  /** Whether a level-up occurs at the end of this segment. */
  levelsUp: boolean;
}

/** A character's full EXP-gain animation: the levels their bar walks through this battle. */
export interface ExpGainTimeline {
  /** The character's level before any EXP was applied. */
  startLevel: number;
  /** Total number of levels gained. */
  totalLevelUps: number;
  /** Ordered segments the bar animates through (always at least one). */
  segments: ExpGainSegment[];
}

/**
 * Builds the per-level animation timeline for a character's EXP gain. Mirrors the
 * level-up loop in `calculateLevelUpsForParty` but records each level the bar walks
 * through, so the rewards screen can fill → pop → reset → refill once per level gained.
 *
 * Pure function: takes the character's pre-battle state and the EXP gained, returns the
 * sequence of fill segments. Always emits at least one segment (a static one when no
 * EXP/level-up occurs).
 *
 * @param character - The party member in their pre-battle state (uses `level` and the
 *   `currentLevelExp` progress-within-current-level field)
 * @param expGained - EXP awarded from the battle
 * @returns The ordered animation timeline
 */
export function buildExpGainTimeline(character: CharacterData, expGained: number): ExpGainTimeline {
  const startLevel = character.level;
  let level = startLevel;
  let progress = Math.max(0, character.currentLevelExp);
  let remaining = Math.max(0, expGained);

  const segments: ExpGainSegment[] = [];
  let totalLevelUps = 0;

  while (level < MAX_LEVEL && totalLevelUps < MAX_LEVEL_UPS_PER_BATTLE) {
    const threshold = getExpThresholdForLevel(level);
    // Guard against a non-positive threshold so we never divide by zero or loop forever.
    const safeThreshold = threshold > 0 ? threshold : 1;
    const fromPercent = (progress / safeThreshold) * 100;
    const needed = safeThreshold - progress;

    if (remaining >= needed) {
      // Enough EXP to clear this level: fill to 100%, level up, reset for the next level.
      segments.push({ level, fromPercent, toPercent: 100, levelsUp: true });
      remaining -= needed;
      level += 1;
      progress = 0;
      totalLevelUps += 1;
      continue;
    }

    // Not enough to level: settle at the real partial fill and stop.
    progress += remaining;
    segments.push({ level, fromPercent, toPercent: (progress / safeThreshold) * 100, levelsUp: false });
    break;
  }

  // Always return at least one segment (e.g. expGained === 0 produces a static bar).
  if (segments.length === 0) {
    const threshold = getExpThresholdForLevel(level);
    const safeThreshold = threshold > 0 ? threshold : 1;
    const percent = (progress / safeThreshold) * 100;
    segments.push({ level, fromPercent: percent, toPercent: percent, levelsUp: false });
  }

  return { startLevel, totalLevelUps, segments };
}

/**
 * Returns a random stat from the character's potential stats
 *
 * @param potentialStats -  The object representing the character's potential stats
 * @param statAmountToIncrease - The amount of stats to increase
 * @returns An object containing the stats to increase
 */
export function getRandomPotentialStats(potentialStats: CoreRPGStats, statAmountToIncrease: number): CoreRPGStats {
  const statIncreases = {
    pow: 0,
    vit: 0,
    spd: 0,
  };
  if (statAmountToIncrease === 0) return statIncreases;

  // Retrieve all valid stats according to the character's potential stats
  const validStats = Object.keys(potentialStats).filter((key) => potentialStats[key as StatType] > 0);
  if (validStats.length === 0) return statIncreases;

  // Create working copies
  let remainingIncreases = statAmountToIncrease;
  let currentValidStats = [...validStats];

  // Increase the stats in the statIncreases object
  while (remainingIncreases > 0) {
    const randomStat = currentValidStats[Math.floor(Math.random() * currentValidStats.length)];
    statIncreases[randomStat as StatType] += 1;
    remainingIncreases -= 1;
    potentialStats[randomStat as StatType] -= 1;

    //Make sure potentialStats are not decreased below 0
    if (potentialStats[randomStat as StatType] === 0) {
      currentValidStats = currentValidStats.filter((stat) => stat !== randomStat);
    }
  }

  return statIncreases;
}
/**
 * Levels up a character
 *
 * @param character - The object representing the character to level up
 * @param randomStats - Stat chosen by the player to be increased, this will reduce the potential stat increases
 * @param chosenStat - The object representing the character to level up, which DOESN'T affect potential stats
 * @param levelUpAmount - The amount of levels to increase the character by
 * @returns The leveled up character object
 */
export function levelUp(
  character: CharacterData,
  chosenStat: CoreRPGStats,
  randomStats: CoreRPGStats | null,
  levelUpAmount: number,
): CharacterData {
  if (levelUpAmount <= 0) return character;
  const initialVit = character.stats.vit;

  // If there's a valid stat to level up, increase the value and decrease the potential value
  if (randomStats) {
    character.stats.pow += randomStats.pow;
    character.potentialStats.pow -= randomStats.pow;
    character.stats.vit += randomStats.vit;
    character.potentialStats.vit -= randomStats.vit;
    character.stats.spd += randomStats.spd;
    character.potentialStats.spd -= randomStats.spd;
  }

  // Increase the chosen stats
  character.stats.pow += chosenStat.pow;
  character.stats.vit += chosenStat.vit;
  character.stats.spd += chosenStat.spd;

  // If vit was increased, recalculate max HP
  if (initialVit !== character.stats.vit) {
    character.maxHp = calculateMaxHp(character.baseHp, character.stats.vit, character.vitHpMultiplier);
  }

  // Increase level; reset progress within the level. The caller sets the true leftover
  // EXP (remainingExp) after this returns.
  character.level += levelUpAmount;
  character.currentLevelExp = 0;

  if (LEVELING_UP_HEALS_CHARACTER) {
    character.currentHp = character.maxHp;
  }
  return character;
}
