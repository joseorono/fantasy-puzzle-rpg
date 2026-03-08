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

/** Minimum time (ms) the loading screen is shown, regardless of actual load speed. */
export const MIN_LOAD_TIME_MS = 800;

/** Duration (ms) before the loot notification auto-dismisses with a fade-out. */
export const LOOT_NOTIFICATION_DISMISS_MS = 3000;

/** Duration (ms) before the floor loot notification auto-dismisses with a fade-out. */
export const FLOOR_LOOT_NOTIFICATION_DISMISS_MS = 1500;

/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 1;
export const GAME_STORE_NAME = 'puzzlerpg';
