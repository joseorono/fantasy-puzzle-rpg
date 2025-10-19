import type { CharacterData, EnemyData, OrbType } from '~/types';

// Board configuration
export const BOARD_ROWS = 8;
export const BOARD_COLS = 6;

// Orb types
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'gray'];

// Match configuration
export const MIN_MATCH_LENGTH = 3;

// Initial party setup
export const INITIAL_PARTY: CharacterData[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    maxHp: 120,
    currentHp: 120,
    skillCooldown: 0,
    maxCooldown: 3,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    class: 'rogue',
    color: 'green',
    maxHp: 90,
    currentHp: 90,
    skillCooldown: 0,
    maxCooldown: 2,
  },
  {
    id: 'mage',
    name: 'Mage',
    class: 'mage',
    color: 'purple',
    maxHp: 80,
    currentHp: 80,
    skillCooldown: 0,
    maxCooldown: 4,
  },
  {
    id: 'healer',
    name: 'Healer',
    class: 'healer',
    color: 'yellow',
    maxHp: 100,
    currentHp: 100,
    skillCooldown: 0,
    maxCooldown: 3,
  },
];

// Initial enemy setup
export const INITIAL_ENEMY: EnemyData = {
  id: 'moss-golem',
  name: 'Moss Golem',
  type: 'golem',
  maxHp: 300,
  currentHp: 300,
  sprite: '🗿', // Placeholder - will be replaced with pixel art
  attackInterval: 4000, // 4 seconds
  attackDamage: 25,
};
