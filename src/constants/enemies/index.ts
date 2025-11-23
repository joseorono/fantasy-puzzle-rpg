import type { EnemyData } from '~/types/rpg-elements';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { MOSS_GOLEM_LOOT } from './loot-tables';

/**
 * Moss Golem - Basic enemy
 */
export const MOSS_GOLEM: EnemyData = {
  id: 'moss-golem',
  name: 'Moss Golem',
  type: 'golem',
  stats: {
    pow: 10,
    vit: 50,
    spd: 0,
  },
  vitHpMultiplier: 5, // Standard enemy HP scaling
  maxHp: calculateMaxHp(50, 50, 5),
  currentHp: 0, // Will be set to maxHp on init
  sprite: '🗿', // Placeholder - will be replaced with pixel art
  attackInterval: 4000, // Base interval (4 seconds)
  attackDamage: 20, // Base damage before POW modifier
  lootTable: MOSS_GOLEM_LOOT,
};

// Set currentHp to maxHp
MOSS_GOLEM.currentHp = MOSS_GOLEM.maxHp;
