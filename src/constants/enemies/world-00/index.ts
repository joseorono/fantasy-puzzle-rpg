import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { MOSS_GOLEM_LOOT, SWAMP_FROG_LOOT } from './loot-tables';

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const MOSS_GOLEM_MAX_HP = calculateMaxHp(50, 70, 5); // 400 HP — tankier so combos don't one-shot it
const SWAMP_FROG_MAX_HP = calculateMaxHp(20, 16, 3); // 68 HP

/**
 * Moss Golem - Basic enemy
 */
export const MOSS_GOLEM: EnemyData = {
  id: 'moss-golem',
  name: 'Moss Golem',
  type: 'golem',
  stats: {
    pow: 14,
    vit: 70,
    spd: 0,
  },
  vitHpMultiplier: 5, // Standard enemy HP scaling
  maxHp: MOSS_GOLEM_MAX_HP,
  currentHp: 0, // Will be set to maxHp on init
  sprite: '/assets/enemy-sprites/gollux_idle.png',
  attackInterval: 4000, // Base interval (4 seconds)
  attackDamage: 24, // Base damage before POW modifier (30 after POW)
  guardBreak: 2.0, // Heavy slams chew through the party Guard meter
  lootTable: MOSS_GOLEM_LOOT,
  expReward: calculateEnemyExpReward(MOSS_GOLEM_MAX_HP), // 62
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
    pow: 9,
    vit: 16,
    spd: 15,
  },
  vitHpMultiplier: 3,
  maxHp: SWAMP_FROG_MAX_HP,
  currentHp: 0,
  sprite: '/assets/enemy-sprites/frogger_idle.png',
  attackInterval: 3000, // Faster attacks (3 seconds)
  attackDamage: 10, // Low damage (11 after POW)
  guardBreak: 0.8, // Light taps erode the party Guard meter
  lootTable: SWAMP_FROG_LOOT,
  expReward: calculateEnemyExpReward(SWAMP_FROG_MAX_HP), // 21
};

SWAMP_FROG.currentHp = SWAMP_FROG.maxHp;
