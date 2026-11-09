import type { GridPosition } from '~/types/geometry';
import type {
  FoeActor,
  FoeDefinition,
  FoeFacing,
  FoeRuntime,
  FoeStepResult,
  FoeTunables,
  FoeWorld,
  PathAdvance,
} from '~/types/foe';
import type { MapPoint } from '~/lib/map-camera';
import {
  FOE_ALERT_FLASH_SECONDS,
  FOE_CONTACT_REARM_RATIO,
  FOE_DEFAULT_TUNABLES,
  FOE_FACING_EPSILON_PX,
  FOE_SPEED_MULTIPLIERS,
} from '~/constants/foe';
import { smoothPath } from './foe-pathfinding';
import { resolveFoeWalkTween } from './foe-sprite';

/**
 * Roaming-enemy (FOE) behaviour as pure functions over a `FoeRuntime` value.
 *
 * A FOE is in one of three modes:
 * - `patrol`: walks its waypoint loop, pausing at each; notices the player inside the
 *   detection radius and switches to `chase`.
 * - `chase`: paths toward the player's tile, repathing when they change tile or the
 *   repath interval elapses. The leash is its territory: it never steps out of it, and a
 *   player beyond it gets a standoff — the FOE holds the edge facing them, lunging again if
 *   they step into reach. Gives up (→ `return`) after `maxStandoffSeconds` of standoff,
 *   after losing sight for `loseSightSeconds`, or when no path exists.
 * - `return`: walks home; on arrival resumes `patrol`. It re-notices the player once
 *   `reaggroCooldownSeconds` has passed, but only while both it and the player are inside
 *   the leash, so a standoff that timed out leaves the player a window to slip past.
 *
 * Contact (the fight trigger) is checked in every mode. The runtime is never mutated:
 * `stepFoe` returns a new value so a frame's result can be compared with its input.
 */

/**
 * Merges the shared defaults with a FOE's overrides, then scales its movement speeds by
 * its speed tier.
 *
 * @param definition The FOE.
 * @param defaults The base tunables, `FOE_DEFAULT_TUNABLES` unless a test says otherwise.
 */
export function resolveFoeTunables(
  definition: FoeDefinition,
  defaults: FoeTunables = FOE_DEFAULT_TUNABLES,
): FoeTunables {
  const merged = { ...defaults, ...definition.overrides };
  const multiplier = FOE_SPEED_MULTIPLIERS[definition.speed];
  return {
    ...merged,
    patrolSpeedTilesPerSecond: merged.patrolSpeedTilesPerSecond * multiplier,
    returnSpeedTilesPerSecond: merged.returnSpeedTilesPerSecond * multiplier,
    chaseSpeedRatio: merged.chaseSpeedRatio * multiplier,
  };
}

/** Centre of a tile in map pixels. */
export function tileCenter(tile: GridPosition, tileSize: number): MapPoint {
  return { x: (tile.col + 0.5) * tileSize, y: (tile.row + 0.5) * tileSize };
}

/** The tile containing a map-pixel point. */
export function pointToTile(point: MapPoint, tileSize: number): GridPosition {
  return { row: Math.floor(point.y / tileSize), col: Math.floor(point.x / tileSize) };
}

/** Squared distance between two points, in map pixels. */
export function distanceSquaredPx(a: MapPoint, b: MapPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Whether two points are within `tiles` of each other (Euclidean, inclusive). */
export function isWithinTiles(a: MapPoint, b: MapPoint, tiles: number, tileSize: number): boolean {
  const radius = tiles * tileSize;
  return distanceSquaredPx(a, b) <= radius * radius;
}

function isSameTile(a: GridPosition | null, b: GridPosition): boolean {
  return a !== null && a.row === b.row && a.col === b.col;
}

function facingFrom(movedX: number, previous: FoeFacing): FoeFacing {
  if (movedX > FOE_FACING_EPSILON_PX) return 'right';
  if (movedX < -FOE_FACING_EPSILON_PX) return 'left';
  return previous;
}

/**
 * A FOE at its home post, in patrol mode, with contact disarmed and a grace period.
 *
 * @param definition The FOE.
 * @param tileSize Map tile size in pixels.
 * @param graceSeconds How long it ignores the player after spawning.
 * @param defaults Base tunables, for tests.
 */
export function createFoeRuntime(
  definition: FoeDefinition,
  tileSize: number,
  graceSeconds: number,
  defaults?: FoeTunables,
): FoeRuntime {
  const home = tileCenter(definition.patrol[0], tileSize);
  return {
    definition,
    tunables: resolveFoeTunables(definition, defaults),
    x: home.x,
    y: home.y,
    mode: 'patrol',
    facing: 'right',
    patrolIndex: definition.patrol.length > 1 ? 1 : 0,
    path: [],
    pathTarget: null,
    waitSeconds: 0,
    repathSeconds: 0,
    lostSightSeconds: 0,
    standoffSeconds: 0,
    graceSeconds,
    alertSeconds: 0,
    reaggroSeconds: 0,
    isContactArmed: false,
    walkTween: resolveFoeWalkTween(definition),
    strideDistancePx: 0,
    isMoving: false,
  };
}

/**
 * Walks from `point` along `path` (tile centre to tile centre) for up to `distancePx`,
 * carrying leftover distance across tiles.
 *
 * @param point Where the walk starts, in map pixels.
 * @param path Tiles to step through, next first.
 * @param distancePx How far to go this step.
 * @param tileSize Map tile size in pixels.
 */
export function advanceAlongPath(
  point: MapPoint,
  path: GridPosition[],
  distancePx: number,
  tileSize: number,
): PathAdvance {
  let { x, y } = point;
  let remaining = distancePx;
  let index = 0;
  let movedX = 0;

  while (remaining > 0 && index < path.length) {
    const target = tileCenter(path[index], tileSize);
    const dx = target.x - x;
    const dy = target.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance <= remaining) {
      x = target.x;
      y = target.y;
      movedX += dx;
      remaining -= distance;
      index++;
    } else {
      const ratio = remaining / distance;
      x += dx * ratio;
      y += dy * ratio;
      movedX += dx * ratio;
      remaining = 0;
    }
  }

  return { point: { x, y }, path: index === 0 ? path : path.slice(index), movedX, arrived: index >= path.length };
}

/** A tile route to `target`, straightened so the FOE walks any angle where the way is clear. */
function findPathFrom(foe: FoeRuntime, target: GridPosition, world: FoeWorld): GridPosition[] | null {
  const { tileSize } = world;
  const path = world.pathfinder.findPath(pointToTile(foe, tileSize), target, world.isWalkable, world.pathNodeBudget);
  if (path === null) return null;
  return smoothPath({ x: foe.x / tileSize, y: foe.y / tileSize }, path, world.isWalkable);
}

function startChase(foe: FoeRuntime): FoeRuntime {
  return {
    ...foe,
    mode: 'chase',
    alertSeconds: FOE_ALERT_FLASH_SECONDS,
    path: [],
    pathTarget: null,
    repathSeconds: 0,
    lostSightSeconds: 0,
    standoffSeconds: 0,
  };
}

function giveUpChase(foe: FoeRuntime): FoeRuntime {
  return {
    ...foe,
    mode: 'return',
    path: [],
    pathTarget: null,
    repathSeconds: 0,
    lostSightSeconds: 0,
    standoffSeconds: 0,
    reaggroSeconds: foe.tunables.reaggroCooldownSeconds,
  };
}

/**
 * Whether a step from `from` to `to` keeps a FOE in its territory: it ends inside the leash,
 * or no farther from home than it started — so a FOE on the edge can slide along it and can
 * always step back in.
 */
function staysInTerritory(from: MapPoint, to: MapPoint, home: MapPoint, leashPx: number): boolean {
  const toDistanceSquared = distanceSquaredPx(to, home);
  return toDistanceSquared <= leashPx * leashPx || toDistanceSquared <= distanceSquaredPx(from, home);
}

/** The point on the leash circle along the ray from home through `point`. */
function projectOntoLeash(point: MapPoint, home: MapPoint, leashPx: number): MapPoint {
  const dx = point.x - home.x;
  const dy = point.y - home.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return home;
  return { x: home.x + (dx / distance) * leashPx, y: home.y + (dy / distance) * leashPx };
}

function stepPatrol(
  foe: FoeRuntime,
  player: FoeActor,
  dtSeconds: number,
  world: FoeWorld,
  canSense: boolean,
): FoeRuntime {
  const { tunables, definition } = foe;
  if (canSense && isWithinTiles(foe, player, tunables.detectionRadiusTiles, world.tileSize)) {
    return startChase(foe);
  }
  if (foe.waitSeconds > 0) {
    return { ...foe, waitSeconds: Math.max(0, foe.waitSeconds - dtSeconds) };
  }

  const waypoint = definition.patrol[foe.patrolIndex];
  let path = foe.path;
  if (path.length === 0 || !isSameTile(foe.pathTarget, waypoint)) {
    // An unreachable waypoint is authoring error; walking straight at it keeps it visible.
    path = findPathFrom(foe, waypoint, world) ?? [waypoint];
  }

  const advance = advanceAlongPath(
    foe,
    path,
    tunables.patrolSpeedTilesPerSecond * world.tileSize * dtSeconds,
    world.tileSize,
  );
  const moved: FoeRuntime = {
    ...foe,
    x: advance.point.x,
    y: advance.point.y,
    path: advance.path,
    pathTarget: waypoint,
    facing: facingFrom(advance.movedX, foe.facing),
  };
  if (!advance.arrived) return moved;

  return {
    ...moved,
    path: [],
    pathTarget: null,
    waitSeconds: tunables.waypointPauseSeconds,
    patrolIndex: (foe.patrolIndex + 1) % definition.patrol.length,
  };
}

/**
 * One chase step toward the player, ignoring the leash. `held` is the same FOE with the
 * fresh path but its position unchanged, for when the step would leave its territory.
 * Null when the player can't be reached.
 */
function chaseStep(
  foe: FoeRuntime,
  player: FoeActor,
  dtSeconds: number,
  world: FoeWorld,
): { moved: FoeRuntime; held: FoeRuntime } | null {
  const { tunables } = foe;
  const { tileSize } = world;
  const speedPx = world.playerRunSpeedPx * tunables.chaseSpeedRatio * dtSeconds;
  const playerTile: GridPosition = { row: player.row, col: player.col };
  const foeTile = pointToTile(foe, tileSize);

  // Sharing the player's tile: head straight for them so contact can land.
  if (isSameTile(foeTile, playerTile)) {
    const dx = player.x - foe.x;
    const dy = player.y - foe.y;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, speedPx);
    const ratio = distance > 0 ? step / distance : 0;
    const held: FoeRuntime = { ...foe, path: [], pathTarget: playerTile };
    return {
      moved: { ...held, x: foe.x + dx * ratio, y: foe.y + dy * ratio, facing: facingFrom(dx * ratio, foe.facing) },
      held,
    };
  }

  let { path, pathTarget, repathSeconds } = foe;
  if (repathSeconds <= 0 || path.length === 0 || !isSameTile(pathTarget, playerTile)) {
    const found = findPathFrom(foe, playerTile, world);
    if (found === null) return null;
    path = found;
    pathTarget = playerTile;
    repathSeconds = tunables.repathIntervalSeconds;
  }

  const advance = advanceAlongPath(foe, path, speedPx, tileSize);
  const held: FoeRuntime = { ...foe, path, pathTarget, repathSeconds };
  return {
    moved: {
      ...held,
      x: advance.point.x,
      y: advance.point.y,
      path: advance.path,
      facing: facingFrom(advance.movedX, foe.facing),
    },
    held,
  };
}

function stepChase(foe: FoeRuntime, player: FoeActor, dtSeconds: number, world: FoeWorld): FoeRuntime {
  const { tunables, definition } = foe;
  const { tileSize } = world;

  const seesPlayer = isWithinTiles(foe, player, tunables.detectionRadiusTiles, tileSize);
  const lostSightSeconds = seesPlayer ? 0 : foe.lostSightSeconds + dtSeconds;
  if (lostSightSeconds >= tunables.loseSightSeconds) return giveUpChase(foe);

  const step = chaseStep(foe, player, dtSeconds, world);
  if (step === null) return giveUpChase(foe);

  const home = tileCenter(definition.patrol[0], tileSize);
  if (staysInTerritory(foe, step.moved, home, tunables.leashRadiusTiles * tileSize)) {
    return { ...step.moved, lostSightSeconds, standoffSeconds: 0 };
  }

  // Standoff: the player is beyond the leash, so hold the edge and stare them down.
  const standoffSeconds = foe.standoffSeconds + dtSeconds;
  if (standoffSeconds >= tunables.maxStandoffSeconds) return giveUpChase(foe);

  // The step pulled back onto the leash keeps its sideways part, so the FOE slides along the
  // edge to where the player is nearest. Projection never travels farther than the step did.
  const edge = projectOntoLeash(step.moved, home, tunables.leashRadiusTiles * tileSize);
  const edgeTile = pointToTile(edge, tileSize);
  const canSlide =
    distanceSquaredPx(edge, foe) <= distanceSquaredPx(step.moved, foe) && world.isWalkable(edgeTile.row, edgeTile.col);
  return {
    ...step.held,
    x: canSlide ? edge.x : foe.x,
    y: canSlide ? edge.y : foe.y,
    lostSightSeconds,
    standoffSeconds,
    facing: facingFrom(player.x - foe.x, foe.facing),
  };
}

function stepReturn(
  foe: FoeRuntime,
  player: FoeActor,
  dtSeconds: number,
  world: FoeWorld,
  canSense: boolean,
): FoeRuntime {
  const { tunables, definition } = foe;
  const home = definition.patrol[0];

  // Only a player inside the leash: one who outlasted a standoff gets a window to slip past.
  const homePoint = tileCenter(home, world.tileSize);
  if (
    canSense &&
    foe.reaggroSeconds <= 0 &&
    isWithinTiles(foe, player, tunables.detectionRadiusTiles, world.tileSize) &&
    isWithinTiles(foe, homePoint, tunables.leashRadiusTiles, world.tileSize) &&
    isWithinTiles(player, homePoint, tunables.leashRadiusTiles, world.tileSize)
  ) {
    return startChase(foe);
  }

  let path = foe.path;
  if (path.length === 0 || !isSameTile(foe.pathTarget, home)) {
    path = findPathFrom(foe, home, world) ?? [home];
  }

  const advance = advanceAlongPath(
    foe,
    path,
    tunables.returnSpeedTilesPerSecond * world.tileSize * dtSeconds,
    world.tileSize,
  );
  const moved: FoeRuntime = {
    ...foe,
    x: advance.point.x,
    y: advance.point.y,
    path: advance.path,
    pathTarget: home,
    facing: facingFrom(advance.movedX, foe.facing),
  };
  if (!advance.arrived) return moved;

  return {
    ...moved,
    mode: 'patrol',
    path: [],
    pathTarget: null,
    patrolIndex: definition.patrol.length > 1 ? 1 : 0,
    waitSeconds: tunables.waypointPauseSeconds,
  };
}

/**
 * Advances one FOE by `dtSeconds`.
 *
 * @param foe The FOE's current state; not mutated.
 * @param player Where the player is.
 * @param dtSeconds Simulated time, in seconds.
 * @param world Map geometry, walkability and the pathfinder.
 * @returns The new state, and whether the player was caught this step.
 */
export function stepFoe(foe: FoeRuntime, player: FoeActor, dtSeconds: number, world: FoeWorld): FoeStepResult {
  const { tunables } = foe;
  const { tileSize } = world;

  const ticked: FoeRuntime = {
    ...foe,
    graceSeconds: Math.max(0, foe.graceSeconds - dtSeconds),
    alertSeconds: Math.max(0, foe.alertSeconds - dtSeconds),
    repathSeconds: Math.max(0, foe.repathSeconds - dtSeconds),
    reaggroSeconds: Math.max(0, foe.reaggroSeconds - dtSeconds),
  };
  if (
    !ticked.isContactArmed &&
    !isWithinTiles(ticked, player, tunables.contactDistanceTiles * FOE_CONTACT_REARM_RATIO, tileSize)
  ) {
    ticked.isContactArmed = true;
  }

  const canSense = ticked.graceSeconds <= 0;
  if (canSense && ticked.isContactArmed && isWithinTiles(ticked, player, tunables.contactDistanceTiles, tileSize)) {
    return { foe: ticked, contact: true };
  }

  switch (ticked.mode) {
    case 'patrol':
      return { foe: stepPatrol(ticked, player, dtSeconds, world, canSense), contact: false };
    case 'chase':
      return { foe: stepChase(ticked, player, dtSeconds, world), contact: false };
    case 'return':
      return { foe: stepReturn(ticked, player, dtSeconds, world, canSense), contact: false };
  }
}
