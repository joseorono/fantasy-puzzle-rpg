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
  return Math.floor(baseHp + vit * vitMultiplier);
}

/**
 * Calculates maximum HP for an entity using its own vitHpMultiplier.
 * This is useful for recalculating HP when stats change.
 * Formula: (maxHP - VIT * vitHpMultiplier) + (VIT * vitHpMultiplier)
 * @param entity Character or enemy data
 * @returns Calculated max HP based on entity's VIT and vitHpMultiplier
 */
export function calculateEntityMaxHp(entity: CharacterData | EnemyData): number {
  // Extract base HP by removing VIT contribution
  const baseHp = entity.maxHp - entity.stats.vit * entity.vitHpMultiplier;
  return calculateMaxHp(baseHp, entity.stats.vit, entity.vitHpMultiplier);
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
  // Use scaled integer math to avoid floating point precision issues
  // Example: 100 * 1.15 may evaluate to 114.999... causing floor to return 114.
  // Compute as (baseDamage * (100 + pow)) / 100 instead.
  return Math.floor((baseDamage * (100 + pow)) / 100);
}

/**
 * Calculates skill damage based on a multiplier, flat bonus, and POW stat.
 * Formula: floor(|baseDamage * multiplier| * (1 + POW/100)) + flatDamageBonus
 * @param baseDamage Base damage value for skills
 * @param pow Power stat
 * @param baseDamageMultiplier Skill-specific damage multiplier
 * @param flatDamageBonus Flat bonus added after scaling (e.g., Rogue burst)
 * @returns Final skill damage value
 */
export function calculateSkillDamage(
  baseDamage: number,
  pow: number,
  baseDamageMultiplier: number,
  flatDamageBonus: number,
): number {
  const scaledBase = Math.abs(baseDamage * baseDamageMultiplier);
  return calculateDamage(scaledBase, pow) + flatDamageBonus;
}

/**
 * Calculates damage for a character's attack.
 * @param character Character data
 * @param baseDamage Base damage of the attack
 * @returns Final damage value
 */
export function calculateCharacterDamage(character: CharacterData, baseDamage: number): number {
  return calculateDamage(baseDamage, character.stats.pow);
}

/**
 * Calculates damage for an enemy's attack.
 * @param enemy Enemy data
 * @returns Final damage value
 */
export function calculateEnemyDamage(enemy: EnemyData): number {
  return calculateDamage(enemy.attackDamage, enemy.stats.pow);
}

/**
 * Calculates the damage multiplier based on match size.
 * @param matchSize Number of orbs matched
 * @returns Damage multiplier (1x, 1.5x, or 2x)
 */
export function calculateMatchMultiplier(matchSize: number): number {
  // Early exits for common cases; 3-match is most frequent
  // Ugly but leverages branch prediction, doesn't allocate memory,
  // can be cached, and is optimized by V8.
  if (matchSize === 3) return 1; // 3: 1x
  if (matchSize === 4) return 1.5; // 4: 1.5x
  if (matchSize === 5) return 1.7; // 5: 1.7x
  if (matchSize >= 6) return 2; // 6+: 2x
  return 1;
}

/**
 * Calculates match-3 damage based on match size and character power.
 * @param matchSize Number of orbs matched
 * @param baseDamage Base damage per match
 * @param pow Power stat
 * @returns Calculated damage
 */
export function calculateMatchDamage(matchSize: number, baseDamage: number = 10, pow: number = 0): number {
  const matchMultiplier = calculateMatchMultiplier(matchSize);
  const damage = baseDamage * matchMultiplier;

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
  return Math.floor(baseInterval / (1 + spd / 100));
}

/**
 * Calculates skill cooldown reduction based on speed stat.
 * Formula: baseCooldown / (1 + (SPD / 100))
 * Higher speed = faster cooldown
 * @param baseCooldown Base cooldown in seconds
 * @param spd Speed stat
 * @returns Calculated cooldown in seconds
 */
export function calculateSkillCooldown(baseCooldown: number, spd: number): number {
  return baseCooldown / (1 + spd / 100);
}

/**
 * Calculates skill cooldown fill rate per second based on speed.
 * Formula: (1 / cooldown) = fills per second
 * @param baseCooldown Base cooldown in seconds
 * @param spd Speed stat
 * @returns Fill rate per second (0-1 range)
 */
export function calculateSkillCooldownFillRate(baseCooldown: number, spd: number): number {
  const actualCooldown = calculateSkillCooldown(baseCooldown, spd);
  return 1 / actualCooldown;
}

/**
 * Calculates enemy attack interval with speed modifier.
 * @param enemy Enemy data
 * @returns Actual attack interval in milliseconds
 */
export function calculateEnemyAttackInterval(enemy: EnemyData): number {
  return calculateAttackInterval(enemy.attackInterval, enemy.stats.spd);
}

/**
 * Calculates character skill cooldown with speed modifier.
 * @param character Character data
 * @returns Actual cooldown in seconds
 */
export function calculateCharacterCooldown(character: CharacterData): number {
  return calculateSkillCooldown(character.maxCooldown, character.stats.spd);
}

// ============================================================================
// Item Cooldown Calculations
// ============================================================================

/**
 * Base cooldown for battle items in seconds.
 */
const BASE_ITEM_COOLDOWN = 10;

/**
 * Calculates the collective (sum) SPD of all party members.
 * @param party Array of character data
 * @returns Total SPD across all party members
 */
export function calculatePartyCollectiveSpd(party: CharacterData[]): number {
  return party.reduce((total, char) => total + char.stats.spd, 0);
}

/**
 * Calculates the shared item cooldown in milliseconds based on the party's collective SPD.
 * Higher collective SPD = shorter cooldown.
 * Formula: (BASE_ITEM_COOLDOWN / (1 + collectiveSPD / 100)) * 1000
 * @param party Array of character data
 * @returns Item cooldown in milliseconds
 */
export function calculateItemCooldownInMs(party: CharacterData[]): number {
  const collectiveSpd = calculatePartyCollectiveSpd(party);
  return Math.floor((BASE_ITEM_COOLDOWN / (1 + collectiveSpd / 100)) * 1000);
}

// ============================================================================
// HP Threshold
// ============================================================================

export type HpThreshold = 'high' | 'medium' | 'low';

/**
 * Returns a threshold tier based on an HP percentage.
 * Used across UI components to determine HP bar colors/classes.
 * @param percentage HP percentage (0-100)
 * @returns 'high' if >50%, 'medium' if >25%, 'low' otherwise
 */
export function getHpThreshold(percentage: number): HpThreshold {
  if (percentage > 50) return 'high';
  if (percentage > 25) return 'medium';
  return 'low';
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
