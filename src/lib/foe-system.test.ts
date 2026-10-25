import { describe, expect, it } from 'vitest';
import { createTilePathfinder } from './foe-pathfinding';
import {
  advanceAlongPath,
  createFoeRuntime,
  isWithinTiles,
  pointToTile,
  resolveFoeTunables,
  stepFoe,
  tileCenter,
} from './foe-system';
import type { FoeActor, FoeDefinition, FoeRuntime, FoeTunables, FoeWorld } from '~/types/foe';
import {
  FOE_ALERT_FLASH_SECONDS,
  FOE_DEFAULT_TUNABLES,
  FOE_PLAYER_RUN_TILES_PER_SECOND,
  FOE_SPEED_MULTIPLIERS,
} from '~/constants/foe';

const TILE = 16;
const RUN_SPEED_PX = FOE_PLAYER_RUN_TILES_PER_SECOND * TILE;
const DT = 1 / 60;

/** `.` walkable, `#` blocked; out of bounds blocked. */
function gridWalkable(rows: string[]) {
  return (row: number, col: number): boolean => {
    if (row < 0 || row >= rows.length) return false;
    const line = rows[row];
    if (col < 0 || col >= line.length) return false;
    return line[col] === '.';
  };
}

/** A 30-wide, 10-tall open field with a wall segment in row 5 (cols 10–19). */
const FIELD = [
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
  '..........##########..........',
  '..............................',
  '..............................',
  '..............................',
  '..............................',
];

function worldFor(rows: string[] = FIELD): FoeWorld {
  return {
    tileSize: TILE,
    playerRunSpeedPx: RUN_SPEED_PX,
    isWalkable: gridWalkable(rows),
    pathfinder: createTilePathfinder(rows[0].length, rows.length),
    pathNodeBudget: 10_000,
  };
}

function playerAt(row: number, col: number): FoeActor {
  return { ...tileCenter({ row, col }, TILE), row, col };
}

function definition(overrides: Partial<FoeDefinition> = {}): FoeDefinition {
  return {
    id: 'foe',
    name: 'Test FOE',
    mapSprite: '/x.png',
    speed: 'normal',
    patrol: [
      { row: 2, col: 2 },
      { row: 2, col: 6 },
      { row: 8, col: 6 },
    ],
    ...overrides,
  };
}

/** A FOE with no grace, so tests that aren't about grace start awake. */
function awakeFoe(def = definition(), tunables?: Partial<FoeTunables>): FoeRuntime {
  const base = tunables ? { ...FOE_DEFAULT_TUNABLES, ...tunables } : undefined;
  return createFoeRuntime(def, TILE, 0, base);
}

/** Steps for `seconds`, returning the final state and whether contact ever fired. */
function simulate(foe: FoeRuntime, player: FoeActor, seconds: number, world = worldFor()) {
  let current = foe;
  let contact = false;
  for (let elapsed = 0; elapsed < seconds; elapsed += DT) {
    const result = stepFoe(current, player, DT, world);
    current = result.foe;
    if (result.contact) {
      contact = true;
      break;
    }
  }
  return { foe: current, contact };
}

const FAR_AWAY = playerAt(9, 29);

describe('resolveFoeTunables', () => {
  it('layers overrides onto the defaults', () => {
    const tunables = resolveFoeTunables(definition({ overrides: { detectionRadiusTiles: 2 } }));
    expect(tunables.detectionRadiusTiles).toBe(2);
    expect(tunables.leashRadiusTiles).toBe(FOE_DEFAULT_TUNABLES.leashRadiusTiles);
  });

  it('keeps the default speeds at normal speed', () => {
    const tunables = resolveFoeTunables(definition({ speed: 'normal' }));
    expect(tunables.patrolSpeedTilesPerSecond).toBe(FOE_DEFAULT_TUNABLES.patrolSpeedTilesPerSecond);
    expect(tunables.returnSpeedTilesPerSecond).toBe(FOE_DEFAULT_TUNABLES.returnSpeedTilesPerSecond);
    expect(tunables.chaseSpeedRatio).toBe(FOE_DEFAULT_TUNABLES.chaseSpeedRatio);
  });

  it('scales every movement speed by the tier, and nothing else', () => {
    const multiplier = FOE_SPEED_MULTIPLIERS.slow;
    const tunables = resolveFoeTunables(definition({ speed: 'slow' }));
    expect(tunables.patrolSpeedTilesPerSecond).toBeCloseTo(FOE_DEFAULT_TUNABLES.patrolSpeedTilesPerSecond * multiplier);
    expect(tunables.returnSpeedTilesPerSecond).toBeCloseTo(FOE_DEFAULT_TUNABLES.returnSpeedTilesPerSecond * multiplier);
    expect(tunables.chaseSpeedRatio).toBeCloseTo(FOE_DEFAULT_TUNABLES.chaseSpeedRatio * multiplier);
    expect(tunables.detectionRadiusTiles).toBe(FOE_DEFAULT_TUNABLES.detectionRadiusTiles);
  });

  it('applies the tier on top of a speed override', () => {
    const tunables = resolveFoeTunables(definition({ speed: 'fast', overrides: { patrolSpeedTilesPerSecond: 3 } }));
    expect(tunables.patrolSpeedTilesPerSecond).toBeCloseTo(3 * FOE_SPEED_MULTIPLIERS.fast);
  });

  it('leaves a fast chase slower than a running player', () => {
    expect(FOE_SPEED_MULTIPLIERS.fast * FOE_DEFAULT_TUNABLES.chaseSpeedRatio).toBeLessThan(1);
  });
});

describe('geometry helpers', () => {
  it('tileCenter and pointToTile invert each other', () => {
    const tile = { row: 3, col: 7 };
    expect(pointToTile(tileCenter(tile, TILE), TILE)).toEqual(tile);
  });

  it('isWithinTiles is Euclidean and inclusive', () => {
    const origin = { x: 0, y: 0 };
    expect(isWithinTiles(origin, { x: 3 * TILE, y: 4 * TILE }, 5, TILE)).toBe(true);
    expect(isWithinTiles(origin, { x: 3 * TILE, y: 4 * TILE }, 4.99, TILE)).toBe(false);
  });
});

describe('advanceAlongPath', () => {
  it('carries leftover distance across tiles', () => {
    const start = tileCenter({ row: 0, col: 0 }, TILE);
    const path = [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    const result = advanceAlongPath(start, path, 1.5 * TILE, TILE);
    expect(result.point.x).toBeCloseTo(2 * TILE);
    expect(result.path).toEqual([{ row: 0, col: 2 }]);
    expect(result.arrived).toBe(false);
    expect(result.movedX).toBeCloseTo(1.5 * TILE);
  });

  it('stops at the last tile and reports arrival', () => {
    const start = tileCenter({ row: 0, col: 0 }, TILE);
    const result = advanceAlongPath(start, [{ row: 0, col: 1 }], 10 * TILE, TILE);
    expect(result.point).toEqual(tileCenter({ row: 0, col: 1 }, TILE));
    expect(result.path).toEqual([]);
    expect(result.arrived).toBe(true);
  });
});

describe('createFoeRuntime', () => {
  it('spawns at the home post, patrolling toward the second waypoint, with grace and contact disarmed', () => {
    const foe = createFoeRuntime(definition(), TILE, 3);
    expect({ x: foe.x, y: foe.y }).toEqual(tileCenter({ row: 2, col: 2 }, TILE));
    expect(foe.mode).toBe('patrol');
    expect(foe.patrolIndex).toBe(1);
    expect(foe.graceSeconds).toBe(3);
    expect(foe.isContactArmed).toBe(false);
  });
});

describe('patrol', () => {
  it('walks to each waypoint in turn, pausing, and loops back to the start', () => {
    const def = definition();
    let foe = awakeFoe(def);
    const world = worldFor();

    // Legs are 4, 6 and 10 tiles at 2 tiles/s plus 0.8 s pauses: well under 15 s per loop.
    const visited: number[] = [];
    for (let elapsed = 0; elapsed < 15; elapsed += DT) {
      const next = stepFoe(foe, FAR_AWAY, DT, world).foe;
      if (next.patrolIndex !== foe.patrolIndex) visited.push(next.patrolIndex);
      foe = next;
    }

    expect(visited.slice(0, 3)).toEqual([2, 0, 1]);
  });

  it('pauses at a waypoint for the configured time', () => {
    const def = definition({
      patrol: [
        { row: 2, col: 2 },
        { row: 2, col: 3 },
      ],
    });
    const { foe } = simulate(awakeFoe(def), FAR_AWAY, 0.6);
    // 1 tile at 2 tiles/s takes 0.5 s; it then waits, still on the waypoint.
    expect(foe.waitSeconds).toBeGreaterThan(0);
    expect({ x: foe.x, y: foe.y }).toEqual(tileCenter({ row: 2, col: 3 }, TILE));
  });

  it('a single-waypoint FOE stays put', () => {
    const def = definition({ patrol: [{ row: 2, col: 2 }] });
    const { foe } = simulate(awakeFoe(def), FAR_AWAY, 3);
    expect({ x: foe.x, y: foe.y }).toEqual(tileCenter({ row: 2, col: 2 }, TILE));
    expect(foe.mode).toBe('patrol');
  });

  it('faces the direction it walks', () => {
    const right = simulate(
      awakeFoe(
        definition({
          patrol: [
            { row: 2, col: 2 },
            { row: 2, col: 6 },
          ],
        }),
      ),
      FAR_AWAY,
      0.5,
    );
    expect(right.foe.facing).toBe('right');
    const left = simulate(
      awakeFoe(
        definition({
          patrol: [
            { row: 2, col: 6 },
            { row: 2, col: 2 },
          ],
        }),
      ),
      FAR_AWAY,
      0.5,
    );
    expect(left.foe.facing).toBe('left');
  });
});

describe('detection', () => {
  it('switches to chase with an alert flash when the player is inside the radius', () => {
    const foe = awakeFoe();
    const result = stepFoe(foe, playerAt(2, 6), DT, worldFor()); // 4 tiles away
    expect(result.foe.mode).toBe('chase');
    expect(result.foe.alertSeconds).toBeCloseTo(FOE_ALERT_FLASH_SECONDS);
  });

  it('keeps patrolling when the player is just outside the radius', () => {
    const foe = awakeFoe();
    const justOutsideCol = 2 + FOE_DEFAULT_TUNABLES.detectionRadiusTiles + 1;
    const result = stepFoe(foe, playerAt(2, justOutsideCol), DT, worldFor());
    expect(result.foe.mode).toBe('patrol');
  });

  it('is blocked by the spawn grace period, then resumes', () => {
    const foe = createFoeRuntime(definition(), TILE, 1);
    const near = playerAt(2, 5);
    const during = simulate(foe, near, 0.5);
    expect(during.foe.mode).toBe('patrol');
    const after = simulate(during.foe, near, 1);
    expect(after.foe.mode).toBe('chase');
  });
});

describe('chase', () => {
  it('closes on the player at a fraction of run speed', () => {
    const foe = { ...awakeFoe(), mode: 'chase' as const };
    const player = playerAt(2, 20);
    const startX = foe.x;
    const { foe: after } = simulate(foe, player, 1);
    const expected = RUN_SPEED_PX * FOE_DEFAULT_TUNABLES.chaseSpeedRatio;
    expect(after.x - startX).toBeGreaterThan(expected * 0.9);
    expect(after.x - startX).toBeLessThanOrEqual(expected * 1.02);
  });

  it('repaths when the player changes tile, and otherwise only on the interval', () => {
    const world = worldFor();
    let foe = stepFoe({ ...awakeFoe(), mode: 'chase' }, playerAt(2, 12), DT, world).foe;
    expect(foe.pathTarget).toEqual({ row: 2, col: 12 });
    const timerAfterFirst = foe.repathSeconds;

    foe = stepFoe(foe, playerAt(2, 12), DT, world).foe;
    expect(foe.repathSeconds).toBeLessThan(timerAfterFirst);
    expect(foe.pathTarget).toEqual({ row: 2, col: 12 });

    foe = stepFoe(foe, playerAt(3, 12), DT, world).foe;
    expect(foe.pathTarget).toEqual({ row: 3, col: 12 });
    expect(foe.repathSeconds).toBeCloseTo(FOE_DEFAULT_TUNABLES.repathIntervalSeconds, 5);
  });

  it('cuts diagonally toward a player across open ground instead of walking an L', () => {
    const foe = { ...awakeFoe(), mode: 'chase' as const };
    const { foe: after } = simulate(foe, playerAt(4, 8), 0.3);
    const movedX = after.x - foe.x;
    const movedY = after.y - foe.y;

    expect(movedX).toBeGreaterThan(0);
    expect(movedY).toBeGreaterThan(0);
    // Heading along the straight line to the player: about 1 row down per 3 columns across.
    expect(movedY / movedX).toBeCloseTo(2 / 6, 1);
  });

  it('paths around walls rather than through them', () => {
    // Home above the wall, player directly below it.
    const def = definition({ patrol: [{ row: 4, col: 15 }] });
    const foe = { ...awakeFoe(def, { leashRadiusTiles: 30 }), mode: 'chase' as const };
    const world = worldFor();
    const { foe: after } = simulate(foe, playerAt(6, 15), 0.3, world);
    for (const tile of after.path) expect(world.isWalkable(tile.row, tile.col)).toBe(true);
    expect(world.isWalkable(pointToTile(after, TILE).row, pointToTile(after, TILE).col)).toBe(true);
  });

  /** Home (2, 2), leash 4: the player at (2, 12) is seen (detection 12) but out of reach. */
  const LEASHED_DEF = definition({
    patrol: [
      { row: 2, col: 2 },
      { row: 2, col: 4 },
    ],
  });
  const LEASH_PX = 4 * TILE;
  const LEASHED_HOME = tileCenter({ row: 2, col: 2 }, TILE);
  const BEYOND_LEASH = playerAt(2, 12);

  function leashedChaser(tunables: Partial<FoeTunables> = {}): FoeRuntime {
    const foe = awakeFoe(LEASHED_DEF, { leashRadiusTiles: 4, detectionRadiusTiles: 12, ...tunables });
    return { ...foe, mode: 'chase' };
  }

  const distanceFromHome = (foe: FoeRuntime) => Math.hypot(foe.x - LEASHED_HOME.x, foe.y - LEASHED_HOME.y);

  it('holds the leash edge facing a player beyond it, instead of turning back', () => {
    const { foe } = simulate(leashedChaser(), BEYOND_LEASH, 1.2);
    expect(foe.mode).toBe('chase');
    expect(foe.standoffSeconds).toBeGreaterThan(0);
    expect(foe.facing).toBe('right');
    expect(distanceFromHome(foe)).toBeLessThanOrEqual(LEASH_PX + 1e-6);
    expect(distanceFromHome(foe)).toBeGreaterThan(LEASH_PX - 2);

    const { foe: later } = stepFoe(foe, BEYOND_LEASH, DT, worldFor());
    expect(later.x).toBeCloseTo(foe.x, 6);
    expect(later.y).toBeCloseTo(foe.y, 6);
  });

  it('lunges again when the player steps into reach', () => {
    const { foe: holding } = simulate(leashedChaser(), BEYOND_LEASH, 1.2);
    const { foe } = stepFoe(holding, playerAt(2, 4), DT, worldFor());
    expect(foe.standoffSeconds).toBe(0);
    expect(foe.x).toBeLessThan(holding.x);
  });

  it('slides along the leash edge to where the player is nearest', () => {
    const { foe: holding } = simulate(leashedChaser(), BEYOND_LEASH, 1.2);
    // Due south of home, 7 tiles out: the nearest edge point is straight below home.
    const { foe } = simulate(holding, playerAt(9, 2), 2);
    expect(foe.mode).toBe('chase');
    expect(foe.standoffSeconds).toBeGreaterThan(0);
    expect(distanceFromHome(foe)).toBeLessThanOrEqual(LEASH_PX + 1e-6);
    expect(foe.x).toBeCloseTo(LEASHED_HOME.x, 0);
    expect(foe.y).toBeCloseTo(LEASHED_HOME.y + LEASH_PX, 0);
  });

  it('gives up a standoff after maxStandoffSeconds and walks home, then patrols again', () => {
    const chased = simulate(leashedChaser({ maxStandoffSeconds: 0.5 }), BEYOND_LEASH, 1.5);
    expect(chased.foe.mode).toBe('return');
    expect(chased.foe.reaggroSeconds).toBeGreaterThan(0);

    // Step until it is back on patrol: that flip happens at the home post.
    let foe2 = chased.foe;
    for (let elapsed = 0; elapsed < 3 && foe2.mode === 'return'; elapsed += DT) {
      foe2 = stepFoe(foe2, FAR_AWAY, DT, worldFor()).foe;
    }
    expect(foe2.mode).toBe('patrol');
    expect({ x: foe2.x, y: foe2.y }).toEqual(tileCenter({ row: 2, col: 2 }, TILE));
    expect(foe2.patrolIndex).toBe(1);
  });

  /** Walking home from (2, 6) toward a single post at (2, 2); the trailing player never touches it. */
  function returningFoe(overrides: Partial<FoeRuntime> = {}): FoeRuntime {
    const def = definition({ patrol: [{ row: 2, col: 2 }] });
    return { ...awakeFoe(def), mode: 'return', x: 6.5 * TILE, y: 2.5 * TILE, ...overrides };
  }
  const TRAILING_PLAYER = playerAt(4, 4);

  it('re-notices a player trailing it home', () => {
    const { foe } = stepFoe(returningFoe(), TRAILING_PLAYER, DT, worldFor());
    expect(foe.mode).toBe('chase');
    expect(foe.alertSeconds).toBe(FOE_ALERT_FLASH_SECONDS);
  });

  it('waits out the re-aggro cooldown after giving up', () => {
    const returning = returningFoe({ reaggroSeconds: 1 });
    const early = simulate(returning, TRAILING_PLAYER, 0.5);
    expect(early.foe.mode).toBe('return');

    const later = simulate(early.foe, TRAILING_PLAYER, 0.6);
    expect(later.foe.mode).toBe('chase');
  });

  it('starts the cooldown when it gives up a chase', () => {
    const foe = { ...awakeFoe(definition(), { leashRadiusTiles: 100, loseSightSeconds: 0.5 }), mode: 'chase' as const };
    const { foe: after } = simulate(foe, FAR_AWAY, 0.6);
    expect(after.mode).toBe('return');
    expect(after.reaggroSeconds).toBeGreaterThan(0);
  });

  it('ignores a player standing outside the leash on the way home, so outlasting a standoff opens a window', () => {
    let current = simulate(leashedChaser({ maxStandoffSeconds: 0.5 }), BEYOND_LEASH, 1.5).foe;
    expect(current.mode).toBe('return');

    for (let elapsed = 0; elapsed < 5 && current.mode === 'return'; elapsed += DT) {
      current = stepFoe(current, BEYOND_LEASH, DT, worldFor()).foe;
      expect(current.mode).not.toBe('chase');
    }
    expect(current.mode).toBe('patrol');
  });

  it('does not re-notice the player during the grace period', () => {
    const { foe } = simulate(returningFoe({ graceSeconds: 1 }), TRAILING_PLAYER, 0.5);
    expect(foe.mode).toBe('return');
  });

  it('abandons the chase after losing sight for long enough', () => {
    const foe = { ...awakeFoe(definition(), { leashRadiusTiles: 100, loseSightSeconds: 0.5 }), mode: 'chase' as const };
    const { foe: after } = simulate(foe, FAR_AWAY, 0.6);
    expect(after.mode).toBe('return');
  });
});

describe('contact', () => {
  it('fires when the player is within contact distance in any mode', () => {
    const foe = awakeFoe();
    const armed = { ...foe, isContactArmed: true };
    const touching = { ...tileCenter({ row: 2, col: 2 }, TILE), row: 2, col: 2 };
    expect(stepFoe(armed, touching, DT, worldFor()).contact).toBe(true);
    expect(stepFoe({ ...armed, mode: 'return' }, touching, DT, worldFor()).contact).toBe(true);
  });

  it('is disarmed at spawn until the player has been clear once', () => {
    const foe = awakeFoe();
    const touching = { ...tileCenter({ row: 2, col: 2 }, TILE), row: 2, col: 2 };
    const onTop = stepFoe(foe, touching, DT, worldFor());
    expect(onTop.contact).toBe(false);

    const walkedOff = stepFoe(onTop.foe, playerAt(2, 4), DT, worldFor());
    expect(walkedOff.foe.isContactArmed).toBe(true);
    expect(stepFoe(walkedOff.foe, touching, DT, worldFor()).contact).toBe(true);
  });

  it('is suppressed during grace', () => {
    const foe = { ...createFoeRuntime(definition(), TILE, 2), isContactArmed: true };
    const touching = { ...tileCenter({ row: 2, col: 2 }, TILE), row: 2, col: 2 };
    expect(stepFoe(foe, touching, DT, worldFor()).contact).toBe(false);
  });

  it('is reached by a chase on an open field', () => {
    const foe = { ...awakeFoe(definition(), { leashRadiusTiles: 50 }), mode: 'chase' as const, isContactArmed: true };
    const { contact } = simulate(foe, playerAt(2, 10), 3);
    expect(contact).toBe(true);
  });
});
