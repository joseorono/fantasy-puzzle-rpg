import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { calculatePercentage } from './math';

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
 * @returns HP percentage (0-100), floored to integer
 */
export function calculatePartyHpPercentage(party: CharacterData[]): number {
  const maxHp = calculatePartyMaxHp(party);
  const currentHp = calculatePartyCurrentHp(party);
  return Math.floor(calculatePercentage(currentHp, maxHp));
}

// ============================================================================
// Damage Calculations
// ============================================================================

/**
 * Calculates damage output based on power stat.
 * Formula: baseDamage * (1 + (POW / 100))
 * @param baseDamage Base damage value
 * @param pow Power stat
 * @returns Calculated damage (rounded)
 */
export function calculateDamage(baseDamage: number, pow: number): number {
  return Math.floor(baseDamage * (1 + (pow / 100)));
}

/**
 * Calculates damage for a character's attack.
 * @param character Character data
 * @param baseDamage Base damage of the attack
 * @returns Final damage value
 */
export function calculateCharacterDamage(character: CharacterData, baseDamage: number): number {
  return calculateDamage(baseDamage, character.pow);
}

/**
 * Calculates damage for an enemy's attack.
 * @param enemy Enemy data
 * @returns Final damage value
 */
export function calculateEnemyDamage(enemy: EnemyData): number {
  return calculateDamage(enemy.attackDamage, enemy.pow);
}

/**
 * Calculates match-3 damage based on match size and character power.
 * @param matchSize Number of orbs matched
 * @param baseDamage Base damage per match
 * @param pow Power stat (optional, for character-specific bonuses)
 * @returns Calculated damage
 */
export function calculateMatchDamage(
  matchSize: number,
  baseDamage: number = 10,
  pow: number = 0
): number {
  // Combo multiplier for 5+ matches
  const comboMultiplier = matchSize >= 5 ? 2 : 1;
  const damage = baseDamage * comboMultiplier;
  
  // Apply power bonus if provided
  if (pow > 0) {
    return calculateDamage(damage, pow);
  }
  
  return damage;
}

// ============================================================================
// Speed Calculations
// ============================================================================

/**
 * Calculates attack interval based on speed stat.
 * Formula: baseInterval / (1 + (SPD / 100))
 * Higher speed = faster attacks (lower interval)
 * @param baseInterval Base attack interval in milliseconds
 * @param spd Speed stat
 * @returns Calculated interval in milliseconds (rounded)
 */
export function calculateAttackInterval(baseInterval: number, spd: number): number {
  return Math.floor(baseInterval / (1 + (spd / 100)));
}

/**
 * Calculates cooldown reduction based on speed stat.
 * Formula: baseCooldown / (1 + (SPD / 100))
 * Higher speed = faster cooldown
 * @param baseCooldown Base cooldown in seconds
 * @param spd Speed stat
 * @returns Calculated cooldown in seconds
 */
export function calculateCooldown(baseCooldown: number, spd: number): number {
  return baseCooldown / (1 + (spd / 100));
}

/**
 * Calculates cooldown fill rate per second based on speed.
 * Formula: (1 / cooldown) = fills per second
 * @param baseCooldown Base cooldown in seconds
 * @param spd Speed stat
 * @returns Fill rate per second (0-1 range)
 */
export function calculateCooldownFillRate(baseCooldown: number, spd: number): number {
  const actualCooldown = calculateCooldown(baseCooldown, spd);
  return 1 / actualCooldown;
}

/**
 * Calculates enemy attack interval with speed modifier.
 * @param enemy Enemy data
 * @returns Actual attack interval in milliseconds
 */
export function calculateEnemyAttackInterval(enemy: EnemyData): number {
  return calculateAttackInterval(enemy.attackInterval, enemy.spd);
}

/**
 * Calculates character skill cooldown with speed modifier.
 * @param character Character data
 * @returns Actual cooldown in seconds
 */
export function calculateCharacterCooldown(character: CharacterData): number {
  return calculateCooldown(character.maxCooldown, character.spd);
}

// ============================================================================
// Stat Utilities
// ============================================================================

/**
 * Creates a stats object with POW, VIT, and SPD.
 * @param pow Power stat (default: 0)
 * @param vit Vitality stat (default: 0)
 * @param spd Speed stat (default: 0)
 * @returns Object with pow, vit, spd properties
 */
export function createStats(pow: number = 0, vit: number = 0, spd: number = 0) {
  return { pow, vit, spd };
}

/**
 * Validates that stats are non-negative.
 * @param stats Object with pow, vit, spd properties
 * @returns True if valid, false otherwise
 */
export function validateStats(stats: { pow: number; vit: number; spd: number }): boolean {
  return stats.pow >= 0 && stats.vit >= 0 && stats.spd >= 0;
}
