/**
 * Dungeon-wide tunable constants. Future dungeon balance knobs live here too.
 */

/**
 * Fraction of each living hero's max HP restored by a free between-floor Rest.
 * Downed heroes are instead revived with 1 HP. Usable once per floor.
 */
export const DUNGEON_REST_HEAL_PERCENT = 0.1;

/** Rest-pool size per run = floor(dungeon floor count / this divisor). */
export const DUNGEON_REST_POOL_DIVISOR = 2.5;

/** Floor for the Rest pool: every dungeon grants at least this many Rests. */
export const DUNGEON_REST_POOL_MINIMUM = 1;
