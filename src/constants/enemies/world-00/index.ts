import type { EnemyData } from '~/types/rpg-elements';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { MOSS_GOLEM_LOOT, SWAMP_FROG_LOOT } from './loot-tables';

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
  sprite: '/assets/enemy-sprites/gollux_idle.png',
  attackInterval: 4000, // Base interval (4 seconds)
  attackDamage: 20, // Base damage before POW modifier
  guardBreak: 1.75, // Heavy slams chew through the party Guard meter
  lootTable: MOSS_GOLEM_LOOT,
  expReward: 60,
  rarityBias: 1, // Tanky elite — slightly better odds at rarer gear
};

// Set currentHp to maxHp
MOSS_GOLEM.currentHp = MOSS_GOLEM.maxHp;

/**
 * Swamp Frog - Weak, fast enemy
 */
export const SWAMP_FROG: EnemyData = {
  id: 'swamp-frog',
  name: 'Swamp Frog',
  type: 'beast',
  stats: {
    pow: 5,
    vit: 10,
    spd: 15,
  },
  vitHpMultiplier: 3,
  maxHp: calculateMaxHp(20, 10, 3),
  currentHp: 0,
  sprite: '/assets/enemy-sprites/frogger_idle.png',
  attackInterval: 3000, // Faster attacks (3 seconds)
  attackDamage: 8, // Low damage
  guardBreak: 0.6, // Light taps barely erode the party Guard meter
  lootTable: SWAMP_FROG_LOOT,
  expReward: 30,
};

SWAMP_FROG.currentHp = SWAMP_FROG.maxHp;
