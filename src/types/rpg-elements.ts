export type OrbColor = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

export type CharacterClass = 'warrior' | 'rogue' | 'mage' | 'healer';

// Base stats shared by both characters and enemies
export interface BaseStats {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
}

// Character-specific stats
export interface CharacterData extends BaseStats {
  class: CharacterClass;
  color: OrbColor;
  skillCooldown: number;
  maxCooldown: number;
}

// Enemy-specific stats
export interface EnemyData extends BaseStats {
  type: string;
  sprite: string;
  attackInterval?: number;
  attackDamage?: number;
}
