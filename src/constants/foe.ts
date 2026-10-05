import type { FoeTunables } from '~/types/foe';
import { RUN_SPEED_MULTIPLIER, WALK_TILES_PER_SECOND } from './map-movement';

/**
 * Tunables for roaming enemies (FOEs). Distances are in tiles so they survive a change
 * of tile size; speeds are tiles per second or ratios of the player's own speed.
 */

/**
 * Behaviour defaults, overridable per FOE through `FoeDefinition.overrides`.
 *
 * `chaseSpeedRatio` is the balance knob: at 0.9 of run speed a FOE moves at
 * `WALK_TILES_PER_SECOND * RUN_SPEED_MULTIPLIER * 0.9` ≈ 6.98 tiles/s — faster than a
 * walking player (5) but slower than a running one (7.75), so a chase is escapable
 * only by holding Shift.
 */
export const FOE_DEFAULT_TUNABLES: FoeTunables = {
  detectionRadiusTiles: 5,
  leashRadiusTiles: 9,
  loseSightSeconds: 2.5,
  chaseSpeedRatio: 0.9,
  patrolSpeedTilesPerSecond: 2,
  returnSpeedTilesPerSecond: 3.5,
  waypointPauseSeconds: 0.8,
  contactDistanceTiles: 0.6,
  repathIntervalSeconds: 0.25,
};

/** The player's run speed in tiles per second — what `chaseSpeedRatio` is a fraction of. */
export const FOE_PLAYER_RUN_TILES_PER_SECOND = WALK_TILES_PER_SECOND * RUN_SPEED_MULTIPLIER;

/**
 * Seconds after the map mounts during which no FOE can notice or catch the player. The
 * player returns from a FOE battle standing where they were caught, so the survivors
 * need to let them walk off.
 */
export const FOE_POST_BATTLE_GRACE_SECONDS = 3;

/** Most cells one path search may expand before giving up (the FOE then heads home). */
export const FOE_PATH_NODE_BUDGET = 2500;

// --- rendering ---

/** Multiplier on the map sprite's natural size. The sprites are authored for 16 px tiles. */
export const FOE_SPRITE_SCALE = 1;

/** How far below the FOE's position its feet sit, as a fraction of a tile. */
export const FOE_FOOT_OFFSET_TILES = 0.25;

/** Idle bob while patrolling, in map pixels. */
export const FOE_BOB_AMPLITUDE_PX = 1;

/** Idle bob rate, in radians per second. */
export const FOE_BOB_RADIANS_PER_SECOND = 4;

/** How long the "!" shows above a FOE that has just spotted the player, in seconds. */
export const FOE_ALERT_FLASH_SECONDS = 0.8;

/** Margin beyond the viewport inside which FOEs are still drawn, in map pixels. */
export const FOE_CULL_MARGIN_PX = 32;

/** Minimap pin and debug-ring look. `color` is an `rgba(` prefix; the alpha is appended. */
export const FOE_MARKER_STYLE = { color: 'rgba(176, 182, 196, ', icon: '👁' } as const;
