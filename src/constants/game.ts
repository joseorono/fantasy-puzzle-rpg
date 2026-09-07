import type { StatType } from '~/types';

// Board and match-3 rules live in `~/constants/board`.

// Stat types
export const STAT_TYPES: StatType[] = ['pow', 'vit', 'spd'];

/** Minimum time (ms) the loading screen is shown, regardless of actual load speed. */
export const MIN_LOAD_TIME_MS = 800;

/** Duration (ms) before the loot notification auto-dismisses with a fade-out. */
export const LOOT_NOTIFICATION_DISMISS_MS = 3000;

/** Loot notification fade-out length (ms). Must match its `transition-duration` in the markup. */
export const LOOT_NOTIFICATION_FADE_MS = 500;

/** Delay (ms) before the loot notification fades in, so its slide-in transition has a frame to run. */
export const LOOT_NOTIFICATION_FADE_IN_DELAY_MS = 50;

/** Duration (ms) before the floor loot notification auto-dismisses with a fade-out. */
export const FLOOR_LOOT_NOTIFICATION_DISMISS_MS = 1500;

/** How long (ms) the save indicator holds on screen before it starts fading out. */
export const SAVE_INDICATOR_HOLD_MS = 1800;

/** Save indicator fade-out length (ms). Must match `save-indicator-out`'s duration in its CSS. */
export const SAVE_INDICATOR_FADE_MS = 350;

/** Columns in the Inn's hero grid. Must match `.inn-party-members-grid`'s CSS `repeat(N, …)`,
 *  since the keyboard cursor chunks the party by it to keep ←/→ spatially truthful. */
export const INN_HERO_COLUMNS = 4;

/**
 * Store configuration
 */
export const GAME_STORE_VERSION = 1;
export const GAME_STORE_NAME = 'puzzlerpg';
