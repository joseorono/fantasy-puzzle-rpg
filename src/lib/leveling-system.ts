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
  const key = Object.keys(character.potentialStats).find((key) => character.potentialStats[key as StatType] > 0);
  return (key as StatType) || null;
}
/**
 * Levels up a character
 *
 * @param character - The object representing the character to level up
 * @returns The leveled up character object
 */
export function levelUp(character: CharacterData): CharacterData {
  let randomStat = getPotentialStat(character);
  if (randomStat) {
    character.stats[randomStat] += 1;
    character.potentialStats[randomStat] -= 1;
  }
  character.maxHp = calculateMaxHp(character.baseHp, character.stats.vit, character.vitHpMultiplier);
  character.level += 1;
  character.expToNextLevel = calculateExpToNextLevel(character.level + 1);
  return character;
}
