import type { GridPosition, Position } from './geometry';

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

export type FoeMode = 'patrol' | 'chase' | 'return';
export type FoeFacing = 'left' | 'right';

/** One FOE's live state. Positions are in map pixels. */
export interface FoeRuntime {
  definition: FoeDefinition;
  /** Defaults merged with the definition's overrides, resolved once. */
  tunables: FoeTunables;
  x: number;
  y: number;
  mode: FoeMode;
  facing: FoeFacing;
  /** Index into `definition.patrol` of the waypoint being walked toward. */
  patrolIndex: number;
  /** Tiles still to step through, next first. */
  path: GridPosition[];
  /** The tile `path` leads to, so a stale path can be recognised. */
  pathTarget: GridPosition | null;
  /** Remaining pause at a waypoint. */
  waitSeconds: number;
  /** Countdown to the next chase repath. */
  repathSeconds: number;
  /** How long the player has been out of sight during a chase. */
  lostSightSeconds: number;
  /** While positive, the FOE neither notices nor catches the player. */
  graceSeconds: number;
  /** While positive, the "!" is shown. */
  alertSeconds: number;
  /** Contact can fire only once the player has been clear of the FOE since it spawned. */
  isContactArmed: boolean;
}

/** The player as the simulation sees it: a map-pixel point and the tile it is in. */
export interface FoeActor extends Position {
  row: number;
  col: number;
}

/** Whether a tile may be walked on. Out-of-bounds tiles must report `false`. */
export type WalkablePredicate = (row: number, col: number) => boolean;

/** A grid path search with its scratch buffers allocated once per map. */
export interface TilePathfinder {
  /**
   * Shortest 4-connected path from `from` to `to`.
   *
   * @param from Start tile; it is not included in the result and need not be walkable.
   * @param to Goal tile; it is the last element of the result.
   * @param isWalkable Walkability of every tile other than `from`.
   * @param nodeBudget Most cells the search may expand before giving up.
   * @returns The tiles to step through, `[]` when already there, or `null` when the goal
   *   is unreachable or the budget ran out.
   */
  findPath(
    from: GridPosition,
    to: GridPosition,
    isWalkable: WalkablePredicate,
    nodeBudget?: number,
  ): GridPosition[] | null;
}

/** Everything about the map a step needs. */
export interface FoeWorld {
  tileSize: number;
  /** The player's run speed in map pixels per second; chase speed is a ratio of it. */
  playerRunSpeedPx: number;
  isWalkable: WalkablePredicate;
  pathfinder: TilePathfinder;
  pathNodeBudget: number;
}

export interface FoeStepResult {
  foe: FoeRuntime;
  /** True when this step caught the player: start the battle. */
  contact: boolean;
}

/** Result of walking along a path for one step. */
export interface PathAdvance {
  point: Position;
  /** The tiles still ahead. */
  path: GridPosition[];
  /** Signed horizontal distance covered, for facing. */
  movedX: number;
  /** True once the last tile was reached. */
  arrived: boolean;
}
