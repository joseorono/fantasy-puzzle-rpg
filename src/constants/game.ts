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

/** A line match of this size or larger spawns a wildcard bomb in the refill. */
export const BOMB_MATCH_SPAWN_THRESHOLD = 5;

/** Chance (0-1) that any individual refilled orb spawns as a wildcard bomb. */
export const BOMB_REFILL_CHANCE = 0.02;

/** After the first bomb spawns in a cascade chain, the per-orb bomb chance is multiplied by this. */
export const CASCADE_BOMB_CHANCE_MULTIPLIER = 0.75;

/** Max wildcard bombs that may spawn across a single cascade chain (anti-runaway). */
export const MAX_CHAIN_BOMB_SPAWNS = 3;

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
