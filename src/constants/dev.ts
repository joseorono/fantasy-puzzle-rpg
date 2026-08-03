/**
 * Development-only toggles. Flip these to speed up local iteration; they should
 * all default to their "production" value so a stray commit is harmless.
 */

/**
 * When true, the start menu is skipped after loading and the game jumps straight
 * to the debug view. Saves time while iterating. Keep `false` for normal play.
 */
export const SKIP_TO_DEBUG_VIEW = false;

/**
 * When true, browser affordances the game normally suppresses stay available — currently
 * the right-click context menu, so "Inspect element" keeps working. Keep `false` for
 * normal play.
 */
export const DEBUG_MODE = true;



