import type { LootTable } from './loot';
import type { RarityTier } from '~/constants/rarity';

export type OrbType = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

export type CharacterClass = 'warrior' | 'rogue' | 'mage' | 'healer';

export type StatType = 'pow' | 'vit' | 'spd';

export type CoreRPGStats = {
  pow: number;
  vit: number;
  spd: number;
};

// Base stats shared by both characters and enemies
export interface BaseStats {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  // Core RPG stats
  stats: CoreRPGStats;
  vitHpMultiplier: number; // How much HP each VIT point grants (e.g., 5 = +5 HP per VIT)
}

// Character-specific stats
export interface CharacterData extends BaseStats {
  baseHp: number;
  class: CharacterClass;
  color: OrbType;
  skillCooldown: number;
  potentialStats: CoreRPGStats;
  maxCooldown: number; // Base cooldown before SPD modifications
  level: number;
  /** EXP accumulated within the current level (0..getExpThresholdForLevel(level)). */
  currentLevelExp: number;
  equippedWeaponId?: string;
  equippedArmorId?: string;
  /** Rolled rarity of the equipped weapon; mirrors `equippedWeaponId`. */
  equippedWeaponRarity?: RarityTier;
  /** Rolled rarity of the equipped armor; mirrors `equippedArmorId`. */
  equippedArmorRarity?: RarityTier;
  /** Ids of skills this character has unlocked (see `~/constants/skills`). */
  unlockedSkillIds: string[];
  /** Id of the currently active skill; resolved via `getSelectedSkill`. */
  selectedSkillId: string;
}

// Enemy-specific stats
export interface EnemyData extends BaseStats {
  type: string;
  sprite: string;
  attackInterval: number; // Base interval before SPD modifications
  attackDamage: number; // Base damage before POW modifications
  lootTable: LootTable; // Loot dropped when defeated
  expReward: number; // Experience points rewarded when defeated
  /** Drain multiplier on the party Guard meter per hit; default 1 (0.5 = barely erodes, 2+ = chews through). */
  guardBreak?: number;
  /**
   * Luck bias applied to equipment-drop rarity rolls; default 0 (neutral odds).
   * Higher values skew this enemy's drops toward rarer tiers. See `rollRarity`.
   */
  rarityBias?: number;
}
