import type { CharacterData, EnemyData } from '~/types/rpg-elements';

/**
 * RPG Calculation Functions
 * Handles stat-based calculations for damage, HP, cooldowns, etc.
 */

// ============================================================================
// HP Calculations
// ============================================================================

/**
 * Calculates maximum HP based on vitality stat.
 * Formula: baseHP + (VIT * vitMultiplier)
 * @param baseHp Base HP value
 * @param vit Vitality stat
 * @param vitMultiplier How much HP each VIT point grants (default: 5)
 * @returns Calculated max HP
 */
export function calculateMaxHp(baseHp: number, vit: number, vitMultiplier: number = 5): number {
  return Math.floor(baseHp + (vit * vitMultiplier));
}

/**
 * Calculates the party's collective maximum HP.
 * @param party Array of character data
 * @returns Total max HP of all party members
 */
export function calculatePartyMaxHp(party: CharacterData[]): number {
  return party.reduce((total, char) => total + char.maxHp, 0);
}

/**
 * Calculates the party's current collective HP.
 * @param party Array of character data
 * @returns Total current HP of all party members
 */
export function calculatePartyCurrentHp(party: CharacterData[]): number {
  return party.reduce((total, char) => total + char.currentHp, 0);
}

/**
 * Calculates the party's HP percentage.
 * @param party Array of character data
 * @returns HP percentage (0-100)
 */
export function calculatePartyHpPercentage(party: CharacterData[]): number {
  const maxHp = calculatePartyMaxHp(party);
  const currentHp = calculatePartyCurrentHp(party);
  return maxHp > 0 ? Math.floor((currentHp / maxHp) * 100) : 0;
}

