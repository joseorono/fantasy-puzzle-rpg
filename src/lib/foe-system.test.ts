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
  type FoeActor,
  type FoeRuntime,
  type FoeWorld,
} from './foe-system';
import type { FoeDefinition, FoeTunables } from '~/types/foe';
import { FOE_ALERT_FLASH_SECONDS, FOE_DEFAULT_TUNABLES } from '~/constants/foe';

const TILE = 16;
const RUN_SPEED_PX = 7.75 * TILE;
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
    const result = stepFoe(foe, playerAt(2, 6), DT, worldFor()); // 4 tiles away, radius 5
    expect(result.foe.mode).toBe('chase');
    expect(result.foe.alertSeconds).toBeCloseTo(FOE_ALERT_FLASH_SECONDS);
  });

  it('keeps patrolling when the player is just outside the radius', () => {
    const foe = awakeFoe();
    const result = stepFoe(foe, playerAt(2, 8), DT, worldFor()); // 6 tiles away
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

  it('paths around walls rather than through them', () => {
    // Home above the wall, player directly below it.
    const def = definition({ patrol: [{ row: 4, col: 15 }] });
    const foe = { ...awakeFoe(def, { leashRadiusTiles: 30 }), mode: 'chase' as const };
    const world = worldFor();
    const { foe: after } = simulate(foe, playerAt(6, 15), 0.3, world);
    for (const tile of after.path) expect(world.isWalkable(tile.row, tile.col)).toBe(true);
    expect(world.isWalkable(pointToTile(after, TILE).row, pointToTile(after, TILE).col)).toBe(true);
  });

  it('gives up past the leash and walks home, then patrols again', () => {
    const def = definition({
      patrol: [
        { row: 2, col: 2 },
        { row: 2, col: 4 },
      ],
    });
    // Detection reaches the player at col 12 but not FAR_AWAY (28 tiles from home).
    const foe = { ...awakeFoe(def, { leashRadiusTiles: 4, detectionRadiusTiles: 12 }), mode: 'chase' as const };
    const player = playerAt(2, 12);

    const chased = simulate(foe, player, 1.2);
    expect(chased.foe.mode).toBe('return');

    // Step until it is back on patrol: that flip happens at the home post.
    let foe2 = chased.foe;
    for (let elapsed = 0; elapsed < 3 && foe2.mode === 'return'; elapsed += DT) {
      foe2 = stepFoe(foe2, FAR_AWAY, DT, worldFor()).foe;
    }
    expect(foe2.mode).toBe('patrol');
    expect({ x: foe2.x, y: foe2.y }).toEqual(tileCenter({ row: 2, col: 2 }, TILE));
    expect(foe2.patrolIndex).toBe(1);
  });

  it('does not re-aggro while walking home, even with the player nearby', () => {
    const def = definition({ patrol: [{ row: 2, col: 2 }] });
    const returning = { ...awakeFoe(def), mode: 'return' as const, x: 6.5 * TILE, y: 2.5 * TILE };
    const { foe } = simulate(returning, playerAt(2, 9), 0.5);
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
