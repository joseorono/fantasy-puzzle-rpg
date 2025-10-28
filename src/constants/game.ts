import type { CharacterData, EnemyData, OrbType, StatType } from '~/types';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { calculateExpToNextLevel } from '~/lib/leveling-system';

// Board configuration
export const BOARD_ROWS = 8;
export const BOARD_COLS = 6;

// Orb types
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'gray'];

// Stat types
export const STAT_TYPES: StatType[] = ['pow', 'vit', 'spd'];

// Match configuration
export const MIN_MATCH_LENGTH = 3;

// RPG Configuration
export const BASE_MATCH_DAMAGE = 10; // Base damage for match-3


/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 1;
export const GAME_STORE_NAME = 'puzzlerpg';

//Default EXP needed for level 1 characters
export const EXP_TO_LEVEL_ONE = calculateExpToNextLevel(1);

// Initial party setup
// Stats: POW (damage), VIT (HP), SPD (cooldown speed), vitHpMultiplier (HP scaling)
const partyBase: CharacterData[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    stats: {
      pow: 6,
      vit: 20,
      spd: 5,
    },
    potentialStats: {
      pow: 30,
      vit: 30,
      spd: 10,
    },
    level: 1,
    baseHp: 50,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 6, // Tanky - highest HP scaling
    maxHp: calculateMaxHp(50, 20, 6),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 3,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    class: 'rogue',
    color: 'green',
    stats: {
      pow: 20,
      vit: 10,
      spd: 25,
    },
    potentialStats: {
      pow: 45,
      vit: 5,
      spd: 20,
    },
    level: 1,
    baseHp: 40,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 3, // Glass cannon - lowest HP scaling
    maxHp: calculateMaxHp(40, 10, 3),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 2,
  },
  {
    id: 'mage',
    name: 'Mage',
    class: 'mage',
    color: 'purple',
    stats: {
      pow: 25,
      vit: 8,
      spd: 10,
    },
    potentialStats: {
      pow: 35,
      vit: 12,
      spd: 17,
    },
    level: 1,
    baseHp: 35,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 4, // Fragile - low HP scaling
    maxHp: calculateMaxHp(35, 8, 4),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 4,
  },
  {
    id: 'healer',
    name: 'Healer',
    class: 'healer',
    color: 'yellow',
    stats: {
      pow: 10,
      vit: 18,
      spd: 12,
    },
    potentialStats: {
      pow: 13,
      vit: 40,
      spd: 17,
    },
    level: 1,
    baseHp: 45,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 5, // Balanced - moderate HP scaling
    maxHp: calculateMaxHp(45, 18, 5),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 3,
  },
];

export const INITIAL_PARTY: CharacterData[] = partyBase.map(char => ({
  ...char,
  currentHp: char.maxHp,
}));

// Initial enemy setup
export const INITIAL_ENEMY: EnemyData = {
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
};

// Set currentHp to maxHp
INITIAL_ENEMY.currentHp = INITIAL_ENEMY.maxHp;
