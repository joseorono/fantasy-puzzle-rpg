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
  /** Seconds after giving up a chase before a returning FOE can notice the player again. */
  reaggroCooldownSeconds: number;
  /** How long a FOE stares from its leash edge at a player it can't reach before heading home. */
  maxStandoffSeconds: number;
}

/**
 * A FOE's map-size animation strip, baked from its battle sheet by
 * `scripts/bake-foe-map-strips.mjs`. Row 0 is idle, row 1 (when present) is move; every
 * cell shares one anchor, so the body stays put across rows.
 */
export interface FoeMapStrip {
  image: string;
  cellW: number;
  cellH: number;
  /** Where the feet sit inside a cell, in strip pixels from the cell's top-left. */
  anchorX: number;
  anchorY: number;
  /** Time-based: plays while standing (and while moving when there is no move row). */
  idle: { frames: number; frameDurationMs: number };
  /** Distance-based: `frameDurationMs` is the pace at `FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND`. */
  move?: { frames: number; frameDurationMs: number };
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
  /** Animated idle/move frames at map size; replaces `mapSprite` once loaded. */
  mapStrip?: FoeMapStrip;
  /**
   * Intensity of the procedural hop-and-squash played while walking; 0 turns it off.
   * Defaults to `FOE_DEFAULT_WALK_TWEEN` without a move row, 0 with one.
   */
  walkTween?: number;
  /** Walkable tiles walked in order and looped. `patrol[0]` is the home post the leash is measured from. */
  patrol: GridPosition[];
  /** Key into `MapDefinition.encounters`; defaults to `id`. */
  encounterId?: string;
  /** Per-FOE overrides of `FOE_DEFAULT_TUNABLES`. */
  overrides?: Partial<FoeTunables>;
}

/** How a kind of FOE looks on the map, shared by every FOE of that kind. */
export type FoeLook = Pick<FoeDefinition, 'mapSprite' | 'mapStrip' | 'walkTween'>;

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
  /** Continuous time a chasing FOE has been held at its leash edge; 0 while it moves. */
  standoffSeconds: number;
  /** While positive, the FOE neither notices nor catches the player. */
  graceSeconds: number;
  /** While positive, the "!" is shown. */
  alertSeconds: number;
  /** While positive, a returning FOE cannot re-notice the player (set on giving up a chase). */
  reaggroSeconds: number;
  /** Contact can fire only once the player has been clear of the FOE since it spawned. */
  isContactArmed: boolean;
  /** `definition.walkTween` with its default resolved. */
  walkTween: number;
  /** Distance walked since spawning, in map pixels; drives move frames and the walk tween. */
  strideDistancePx: number;
  /** Whether the FOE moved on the last simulation step. */
  isMoving: boolean;
}

/** The player as the simulation sees it: a map-pixel point and the tile it is in. */
export interface FoeActor extends Position, GridPosition {}

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
