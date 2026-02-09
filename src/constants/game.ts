import type { OrbType, StatType } from '~/types';

// Board configuration
export const BOARD_ROWS = 8;
export const BOARD_COLS = 6;

// Orb types
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'gray'];

// Stat types
export const STAT_TYPES: StatType[] = ['pow', 'vit', 'spd'];

// Match configuration
export const MIN_MATCH_LENGTH = 3;

/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 1;
export const GAME_STORE_NAME = 'puzzlerpg';
