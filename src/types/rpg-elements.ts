import type { LootTable } from './loot';

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
  expToNextLevel: number;
}

// Enemy-specific stats
export interface EnemyData extends BaseStats {
  type: string;
  sprite: string;
  attackInterval: number; // Base interval before SPD modifications
  attackDamage: number; // Base damage before POW modifications
  lootTable: LootTable; // Loot dropped when defeated
}
