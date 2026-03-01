import type { OrbType, StatType } from '~/types';

// Board configuration
export const BOARD_ROWS = 6;
export const BOARD_COLS = 8;

// Orb types
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'gray'];

// Stat types
export const STAT_TYPES: StatType[] = ['pow', 'vit', 'spd'];

// Match configuration
export const MIN_MATCH_LENGTH = 3;

/** Minimum time (ms) the loading screen is shown, regardless of actual load speed. */
export const MIN_LOAD_TIME_MS = 1000;

/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 1;
export const GAME_STORE_NAME = 'puzzlerpg';
