import type { CharacterData, CoreRPGStats, StatType } from '~/types';
import { calculateMaxHp } from './rpg-calculations';
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

// TODO: Implement leveling system
// - calculateExpToNextLevel(level: number): number
// - calculateStatGrowth(baseStat: number, level: number, growthRate: number): number
// - levelUp(character: CharacterData): CharacterData
// - etc.

// DO NOT IMPLEMENT WITHOUT CONSULTING JOSE

/**
 * Calculates the amount of EXP required to reach a specific level
 *
 * @returns The amount of EXP required to reach a certain level (currently just an exponential function)
 */
export function calculateExpToNextLevel(level: number): number {
  return Math.exp(level);
}

/**
 * Returns a random stat from the character's potential stats
 *
 * @param character - The object representing the character
 * @returns An object containing the stats to increase
 */
export function getRandomPotentialStats(character: CharacterData, statAmountToIncrease: number): CoreRPGStats | null {
  if (statAmountToIncrease === 0) return null;

  // Retrieve all valid stats according to the character's potential stats
  const validStats = Object.keys(character.potentialStats).filter(
    (key) => character.potentialStats[key as StatType] > 0,
  );
  if (validStats.length === 0) return null;

  let statIncreases = {
    pow: 0,
    vit: 0,
    spd: 0,
  };

  // Increase the stats in the statIncreases object
  while (statAmountToIncrease > 0) {
    const randomStat = validStats[Math.floor(Math.random() * validStats.length)];
    statIncreases[randomStat as StatType] += 1;
    statAmountToIncrease -= 1;
    character.potentialStats[randomStat as StatType] -= 1;

    //Make sure potentialStats are not decreased below 0
    if (character.potentialStats[randomStat as StatType] === 0) {
      validStats.splice(validStats.indexOf(randomStat), 1);
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

  // Increase level and calculate new exp to next level
  character.level += levelUpAmount;
  character.expToNextLevel = calculateExpToNextLevel(character.level);
  return character;
}
