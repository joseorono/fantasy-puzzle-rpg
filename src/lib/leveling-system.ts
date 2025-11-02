import type { CharacterData, StatType } from '~/types';
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
 * @returns A random non-zero stat from the character's potential stats or null if no non-zero stats are found
 */
export function getPotentialStat(character: CharacterData): StatType | null {
  // Retrieve all valid stats
  const validKeys = Object.keys(character.potentialStats).filter(
    (key) => character.potentialStats[key as StatType] > 0,
  );
  // If no valid stats, return null
  if (validKeys.length === 0) return null;

  // Otherwise, return a random valid stat
  const randomIndex = Math.floor(Math.random() * validKeys.length);
  return validKeys[randomIndex] as StatType;
}
/**
 * Levels up a character
 *
 * @param character - The object representing the character to level up
 * @param randomStat - Stat chosen by the player to be increased, this will reduce the potential stat increases
 * @param chosenStat - The object representing the character to level up, which DOESN'T affect potential stats
 * @returns The leveled up character object
 */
export function levelUp(
  character: CharacterData,
  chosenStat: StatType | null,
  randomStat: StatType | null,
): CharacterData {
  // If there's a valid stat to level up, increase the value and decrease the potential value
  if (chosenStat) {
    character.stats[chosenStat] += 1;
  }

  //I think this would always be true but just in case yk
  if (randomStat) {
    character.stats[randomStat] += 1;
    character.potentialStats[randomStat] -= 1;
  }

  // If vit was increased, recalculate max HP
  if (randomStat === 'vit' || chosenStat === 'vit') {
    character.maxHp = calculateMaxHp(character.baseHp, character.stats.vit, character.vitHpMultiplier);
  }

  // Increase level and calculate new exp to next level
  character.level += 1;
  character.expToNextLevel = calculateExpToNextLevel(character.level);
  return character;
}
