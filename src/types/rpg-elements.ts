export type OrbType = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

export type CharacterClass = 'warrior' | 'rogue' | 'mage' | 'healer';

// Base stats shared by both characters and enemies
export interface BaseStats {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  // Core RPG stats
  pow: number; // Power - affects damage output
  vit: number; // Vitality - affects HP
  spd: number; // Speed - affects cooldowns/attack intervals
}

// Character-specific stats
export interface CharacterData extends BaseStats {
  class: CharacterClass;
  color: OrbType;
  skillCooldown: number;
  maxCooldown: number; // Base cooldown before SPD modifications
}

// Enemy-specific stats
export interface EnemyData extends BaseStats {
  type: string;
  sprite: string;
  attackInterval: number; // Base interval before SPD modifications
  attackDamage: number; // Base damage before POW modifications
}
