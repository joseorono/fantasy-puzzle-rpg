import type { BaseSlice } from '../../types/store';

/**
 * Small cross-cutting counters and one-off flags that persist for the life of a
 * save file — the shared home for values too small to earn their own slice.
 *
 * Membership rule: scalars and booleans only. Per-node or per-map records belong
 * in `mapProgress` / `floorLootProgress`, domain objects belong in their own
 * slice, and run-scoped values belong in Jotai (see `dungeon-atoms.ts`). Nothing
 * here resets except on a new game.
 */
export interface ProgressFlagsState {
  /** How many times the player has respecced a hero, for the escalating respec cost. */
  respecCount: number;
}

/**
 * Progress flags slice actions
 */
export interface ProgressFlagsActions {
  /** Record a respec, advancing the counter the cost curve reads. */
  registerRespec: () => void;
}

/**
 * Complete progress flags slice interface
 */
export interface ProgressFlagsSlice extends BaseSlice {
  progressFlags: ProgressFlagsState;
  actions: {
    progressFlags: ProgressFlagsActions;
  };
}
