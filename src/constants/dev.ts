import type { Resources } from '~/types/resources';

/**
 * Development-only toggles and fixtures. Flip the toggles to speed up local iteration; they
 * should all default to their "production" value so a stray commit is harmless.
 */

/**
 * When true, the start menu is skipped after loading and the game jumps straight
 * to the debug view. Saves time while iterating. Keep `false` for normal play.
 */
export const SKIP_TO_DEBUG_VIEW = false;

/**
 * When true, developer affordances the game normally suppresses stay available. Keep
 * `false` for normal play. Currently:
 *
 * - the right-click context menu, so "Inspect element" keeps working
 * - loading a save seeds the debug view behind the map, so the map's back button stays
 *   visible and returns there instead of hiding (`loadSlot` in `use-save-game.ts`)
 */
export const DEBUG_MODE = true;

/**
 * Resource top-up handed out by debug shortcuts — the grant button on the Skill Debug screen
 * and the EXP piñata encounter both hand over exactly this, so either route leaves a party
 * with the same spending money.
 */
export const DEBUG_RESOURCE_PAYLOAD: Resources = {
  coins: 1000,
  gold: 25,
  copper: 25,
  silver: 25,
  iron: 50,
};
