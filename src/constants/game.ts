import type { OrbType, StatType } from '~/types';

// Board configuration
export const BOARD_ROWS = 8;
export const BOARD_COLS = 6;

// Orb types
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'red'];

// Stat types
export const STAT_TYPES: StatType[] = ['pow', 'vit', 'spd'];

// Match configuration
export const MIN_MATCH_LENGTH = 3;

/** Minimum time (ms) the loading screen is shown, regardless of actual load speed. */
export const MIN_LOAD_TIME_MS = 1000;

/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 2;
export const GAME_STORE_NAME = 'puzzlerpg';
