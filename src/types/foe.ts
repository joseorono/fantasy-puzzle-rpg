import type { GridPosition } from './geometry';

/**
 * Behaviour knobs for a roaming enemy. Defaults live in `src/constants/foe.ts`;
 * a `FoeDefinition` may override any of them.
 */
export interface FoeTunables {
  /** The FOE notices the player inside this radius (tiles, measured centre to centre). */
  detectionRadiusTiles: number;
  /** Farther than this from its home post, a chasing FOE gives up and walks back. */
  leashRadiusTiles: number;
  /** Seconds the player must stay outside the detection radius before a chase is abandoned. */
  loseSightSeconds: number;
  /** Chase speed as a fraction of the player's *run* speed. */
  chaseSpeedRatio: number;
  /** Walking speed while patrolling, in tiles per second. */
  patrolSpeedTilesPerSecond: number;
  /** Walking speed while heading home after a chase, in tiles per second. */
  returnSpeedTilesPerSecond: number;
  /** Pause at each patrol waypoint, in seconds. */
  waypointPauseSeconds: number;
  /** Centre-to-centre distance (tiles) at which the FOE catches the player. */
  contactDistanceTiles: number;
  /** Shortest interval between path recomputations while chasing, in seconds. */
  repathIntervalSeconds: number;
}

/**
 * A roaming overworld enemy (a "FOE"): patrols a loop, chases the player on sight and
 * starts a battle on contact. Authored per map in `MapDefinition.foes`.
 */
export interface FoeDefinition {
  /** Globally unique — prefix with the map, like node ids. Keys `mapProgress.foesDefeated`. */
  id: string;
  name: string;
  /** PNG drawn on the map canvas at its natural size (see `scripts/recolor-sprite.py`). */
  mapSprite: string;
  /** Walkable tiles walked in order and looped. `patrol[0]` is the home post the leash is measured from. */
  patrol: GridPosition[];
  /** Key into `MapDefinition.encounters`; defaults to `id`. */
  encounterId?: string;
  /** Per-FOE overrides of `FOE_DEFAULT_TUNABLES`. */
  overrides?: Partial<FoeTunables>;
}
