import type { LootTable } from './loot';
import type { RarityTier } from '~/constants/rarity';
import type { AdmurinEnemySheet } from './admurin-enemies';

export type OrbType = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

/** What damage can come from: a matched colour, or any hero's Ultimate. */
export type DamageKind = 'match' | 'ultimate';

/** What an enemy can be weak to: a colour (whoever lands it), or Ultimates as a whole. */
export type WeaknessSource = OrbType | 'ultimate';

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
  /**
   * EXP progress within the current level — normally `0..getExpThresholdForLevel(level)`. It may
   * transiently exceed the threshold right after a battle award, until the leveling system applies
   * the pending level-ups and rolls the overflow into the next level.
   */
  currentLevelExp: number;
  equippedWeaponId?: string;
  equippedArmorId?: string;
  /** Rolled rarity of the equipped weapon; mirrors `equippedWeaponId`. */
  equippedWeaponRarity?: RarityTier;
  /** Rolled rarity of the equipped armor; mirrors `equippedArmorId`. */
  equippedArmorRarity?: RarityTier;
  /** Ids of Active skills this character has unlocked (see `~/constants/skills`). */
  unlockedSkillIds: string[];
  /** Id of the currently active skill; resolved via `getSelectedSkill`. */
  selectedSkillId: string;
  /** Ids of Passive skills this character has unlocked. All of them apply at once. */
  unlockedPassiveIds: string[];
  /** Current level of each unlocked skill/passive, keyed by id. Missing id = level 1. */
  skillLevels: Record<string, number>;
}

/** One of an enemy's attacks. Multipliers scale the base EnemyData fields. */
export interface EnemyAttackVariant {
  /** Display name, e.g. 'Tongue' or 'Attack B'. */
  name: string;
  /** × EnemyData.attackDamage. */
  damageMultiplier: number;
  /** × the countdown leading into this attack (default 1). */
  intervalMultiplier?: number;
  /** × EnemyData.guardBreak (default 1). */
  guardBreakMultiplier?: number;
}

// Enemy-specific stats
export interface EnemyData extends BaseStats {
  type: string;
  sprite: string;
  /** Admurin packs only: the combined sheet this enemy animates from. */
  admurinSheet?: AdmurinEnemySheet;
  /** Two attack variants alternate per cycle; absent = today's single implicit attack. */
  attacks?: EnemyAttackVariant[];
  /** Battle card size. Default 'md'. */
  spriteSize?: 'md' | 'lg' | 'xl';
  attackInterval: number; // Base interval before SPD modifications
  attackDamage: number; // Base damage before POW modifications
  lootTable: LootTable; // Loot dropped when defeated
  expReward: number; // Experience points rewarded when defeated
  /** Drain multiplier on the party Guard meter per hit; default 1 (0.5 = barely erodes, 2+ = chews through). */
  guardBreak?: number;
  /**
   * Multiplier on incoming poise (posture) damage; default 1. `0.5` = stoic, hard to stagger;
   * `2` = glass jaw. The pool itself is derived from max HP — see `~/lib/poise-system`.
   */
  poise?: number;
  /** Takes `WEAKNESS_DAMAGE_BONUS` extra HP damage from any of these, applied once per hit. */
  weakTo?: WeaknessSource[];
  /**
   * Luck bias applied to equipment-drop rarity rolls; default 0 (neutral odds).
   * Higher values skew this enemy's drops toward rarer tiers. See `rollRarity`.
   */
  rarityBias?: number;
}
