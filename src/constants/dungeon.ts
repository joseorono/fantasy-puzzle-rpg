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

/**
 * A randomized-dungeon bonus chest grants a random fraction of the dungeon's total
 * estimated resources, rolled uniformly within this band.
 */
export const REMIX_CHEST_MIN_RESOURCE_PERCENT = 0.1; // 10%
export const REMIX_CHEST_MAX_RESOURCE_PERCENT = 0.25; // 25%

/**
 * Marker icons for each floor state in the descent track. Custom pixel-art SVGs
 * drawn on a 16px grid, styled after the indigolay icon set (dark outline, warm
 * fill, lit top bevel). Colors are baked per state, so the track markers are
 * recolored here rather than via CSS.
 */
export const DUNGEON_FLOOR_MARK_ICONS = {
  completed: '/assets/icons/dungeon-floors/floor-completed.svg',
  current: '/assets/icons/dungeon-floors/floor-current.svg',
  boss: '/assets/icons/dungeon-floors/floor-boss.svg',
  locked: '/assets/icons/dungeon-floors/floor-locked.svg',
} as const;
