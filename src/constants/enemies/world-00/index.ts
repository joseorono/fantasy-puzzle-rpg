import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { MOSS_GOLEM_LOOT, STONE_GOLEM_LOOT, SWAMP_FROG_LOOT } from './loot-tables';

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const MOSS_GOLEM_MAX_HP = calculateMaxHp(50, 70, 5); // 400 HP — tankier so combos don't one-shot it
const SWAMP_FROG_MAX_HP = calculateMaxHp(20, 16, 3); // 68 HP
const STONE_GOLEM_MAX_HP = calculateMaxHp(100, 140, 5); // 800 HP — a roaming FOE, twice the Moss Golem

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
  poise: 0.5, // Stone — takes half poise damage, hard to stagger
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
  poise: 1.6, // Squishy — staggers easily
  lootTable: SWAMP_FROG_LOOT,
  expReward: calculateEnemyExpReward(SWAMP_FROG_MAX_HP), // 21
};

SWAMP_FROG.currentHp = SWAMP_FROG.maxHp;

/**
 * Stone Golem - Roaming FOE. Guards chests and side paths; meant to be fled from until the party outgrows it.
 */
export const STONE_GOLEM: EnemyData = {
  id: 'stone-golem',
  name: 'Stone Golem',
  type: 'golem',
  stats: {
    pow: 22,
    vit: 140,
    spd: 0,
  },
  vitHpMultiplier: 5,
  maxHp: STONE_GOLEM_MAX_HP,
  currentHp: 0,
  sprite: '/assets/enemy-sprites/stone_golem_idle.png',
  attackInterval: 4500, // Slow, telegraphed slams
  attackDamage: 34, // Base damage before POW modifier (48 after POW)
  guardBreak: 2.5, // Each hit chews through most of the party Guard meter
  poise: 0.35, // Solid rock — very hard to stagger
  lootTable: STONE_GOLEM_LOOT,
  expReward: calculateEnemyExpReward(STONE_GOLEM_MAX_HP), // 112
  rarityBias: 3, // A guardian's hoard — markedly better odds at rarer gear
};

STONE_GOLEM.currentHp = STONE_GOLEM.maxHp;
