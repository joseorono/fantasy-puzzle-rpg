import { describe, expect, it } from 'vitest';
import { resolveMovementStep } from './map-movement';
import type { MovementContext, MovementInput, MovementPointState } from './map-movement';
import {
  CORNER_ASSIST_MAX_OFFSET_TILES,
  MOVEMENT_STEP_SECONDS,
  PATH_CENTERING_DEADZONE_TILES,
} from '~/constants/map-movement';

const TILE = 16;
const WALK_SPEED = 5 * TILE; // 5 tiles/sec in map pixels

/**
 * Builds an `isWalkable` predicate from an ASCII grid.
 * `.` = walkable, `#` = blocked. Out-of-bounds is blocked.
 */
function gridWalkable(rows: string[]) {
  return (row: number, col: number): boolean => {
    if (row < 0 || row >= rows.length) return false;
    const line = rows[row];
    if (col < 0 || col >= line.length) return false;
    return line[col] === '.';
  };
}

/** Places the character at the centre of a tile. */
function atTileCenter(row: number, col: number): MovementPointState {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE, row, col };
}

function ctxFor(rows: string[], stepSeconds = MOVEMENT_STEP_SECONDS): MovementContext {
  return { tileSize: TILE, isWalkable: gridWalkable(rows), stepSeconds };
}

function input(dirX: number, dirY: number, speed = WALK_SPEED): MovementInput {
  return { dirX, dirY, speed, walkSpeed: WALK_SPEED };
}

/** Runs `steps` substeps, threading state through. */
function simulate(start: MovementPointState, movementInput: MovementInput, ctx: MovementContext, steps: number) {
  let state: MovementPointState = start;
  let totalDistance = 0;
  let lastResult = resolveMovementStep(state, movementInput, ctx);

  for (let i = 0; i < steps; i++) {
    lastResult = resolveMovementStep(state, movementInput, ctx);
    totalDistance += lastResult.movedDistance;
    state = lastResult;
  }

  return { ...lastResult, totalDistance };
}

// ---------------------------------------------------------------------------
// speed & normalisation
// ---------------------------------------------------------------------------

describe('resolveMovementStep — speed', () => {
  const open = ['.....', '.....', '.....', '.....', '.....'];

  it('covers speed × stepSeconds in one cardinal step', () => {
    const result = resolveMovementStep(atTileCenter(2, 2), input(1, 0), ctxFor(open));
    expect(result.movedDistance).toBeCloseTo(WALK_SPEED * MOVEMENT_STEP_SECONDS, 6);
  });

  it('moves a normalised diagonal at the same speed as a cardinal', () => {
    const diagonal = Math.SQRT1_2;
    const cardinal = simulate(atTileCenter(2, 2), input(1, 0), ctxFor(open), 30);
    const diag = simulate(atTileCenter(2, 2), input(diagonal, diagonal), ctxFor(open), 30);

    // Path centering only acts on single-axis movement, so the cardinal run is
    // pure horizontal travel and the diagonal run is pure diagonal travel.
    expect(diag.totalDistance).toBeCloseTo(cardinal.totalDistance, 4);
  });

  it('runs faster than it walks', () => {
    const walk = simulate(atTileCenter(2, 2), input(1, 0), ctxFor(open), 30);
    const run = simulate(atTileCenter(2, 2), input(1, 0, WALK_SPEED * 2), ctxFor(open), 30);
    expect(run.totalDistance).toBeCloseTo(walk.totalDistance * 2, 4);
  });
});

// ---------------------------------------------------------------------------
// collision
// ---------------------------------------------------------------------------

describe('resolveMovementStep — collision', () => {
  const wallOnTheRight = ['.....', '.....', '..#..', '.....', '.....'];

  it('stops against a wall and reports the axis blocked', () => {
    const result = simulate(atTileCenter(2, 1), input(1, 0), ctxFor(wallOnTheRight), 200);
    expect(result.blockedX).toBe(true);
    expect(result.col).toBe(1);
    expect(result.x).toBeLessThan(2 * TILE);
    expect(result.x).toBeGreaterThan(2 * TILE - 1);
  });

  it('holds a stable position while pressed against a wall (no vibration)', () => {
    const ctx = ctxFor(wallOnTheRight);
    const settled = simulate(atTileCenter(2, 1), input(1, 0), ctx, 200);

    const next = resolveMovementStep(settled, input(1, 0), ctx);
    expect(next.x).toBe(settled.x);
    expect(next.y).toBe(settled.y);
    expect(next.movedDistance).toBe(0);
  });

  it('unblocks immediately when the tile becomes walkable (no latching)', () => {
    let open = false;
    const ctx: MovementContext = {
      tileSize: TILE,
      stepSeconds: MOVEMENT_STEP_SECONDS,
      isWalkable: (row, col) => (row === 2 && col === 2 ? open : gridWalkable(wallOnTheRight)(row, col)),
    };

    const settled = simulate(atTileCenter(2, 1), input(1, 0), ctx, 200);
    expect(settled.blockedX).toBe(true);

    open = true;
    const after = simulate(settled, input(1, 0), ctx, 10);
    expect(after.col).toBe(2);
    expect(after.blockedX).toBe(false);
  });

  it('slides along a wall instead of stopping dead', () => {
    // Wall to the right along the whole column; player pushes right + down.
    const corridor = ['.#...', '.#...', '.#...', '.#...', '.#...'];
    const diagonal = Math.SQRT1_2;
    const result = simulate(atTileCenter(0, 0), input(diagonal, diagonal), ctxFor(corridor), 400);

    expect(result.col).toBe(0);
    expect(result.blockedX).toBe(true);
    expect(result.row).toBeGreaterThan(0); // vertical movement survived
  });

  it('does not cut through a diagonal pinhole corner', () => {
    // Moving down-right from (0,0): (0,1) and (1,0) are blocked, only the
    // diagonal (1,1) is open. The character must not slip through.
    const pinhole = ['.#.', '#..', '...'];
    const diagonal = Math.SQRT1_2;
    const result = simulate(atTileCenter(0, 0), input(diagonal, diagonal), ctxFor(pinhole), 400);

    expect(result.row).toBe(0);
    expect(result.col).toBe(0);
  });

  it('treats out-of-bounds as blocked', () => {
    const open = ['...', '...', '...'];
    const result = simulate(atTileCenter(1, 0), input(-1, 0), ctxFor(open), 400);
    expect(result.col).toBe(0);
    expect(result.x).toBeGreaterThan(0);
  });

  it('does not tunnel through a wall at extreme speed', () => {
    // 40 tiles in a single step — must still stop at the wall.
    const ctx = ctxFor(wallOnTheRight, 1);
    const result = resolveMovementStep(atTileCenter(2, 0), input(1, 0, 40 * TILE), ctx);

    expect(result.col).toBe(1);
    expect(result.blockedX).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// path centering
// ---------------------------------------------------------------------------

describe('resolveMovementStep — path centering', () => {
  const open = ['.....', '.....', '.....', '.....', '.....'];

  it('pulls an off-centre character toward the road centre line', () => {
    const offCentre: MovementPointState = { x: 2.5 * TILE, y: 2.05 * TILE, row: 2, col: 2 };
    const result = simulate(offCentre, input(1, 0), ctxFor(open), 40);

    expect(Math.abs(result.y - 2.5 * TILE)).toBeLessThanOrEqual(PATH_CENTERING_DEADZONE_TILES * TILE);
  });

  it('does not centre while the tile straight ahead is blocked', () => {
    // Centring here would drag the character to the middle of its tile just as
    // it reaches the wall, spending the alignment corner assist needs.
    // Solid wall column — no gap for corner assist to aim at.
    const wallAhead = ['..#..', '..#..', '..#..', '..#..', '..#..'];
    const offCentre: MovementPointState = { x: 1.5 * TILE, y: 2.05 * TILE, row: 2, col: 1 };
    const result = simulate(offCentre, input(1, 0), ctxFor(wallAhead), 40);

    expect(result.blockedX).toBe(true);
    expect(result.y).toBe(offCentre.y);
  });

  it('stops centring inside the deadzone', () => {
    const nearlyCentred: MovementPointState = {
      x: 2.5 * TILE,
      y: (2.5 + PATH_CENTERING_DEADZONE_TILES / 2) * TILE,
      row: 2,
      col: 2,
    };
    const result = resolveMovementStep(nearlyCentred, input(1, 0), ctxFor(open));
    expect(result.y).toBe(nearlyCentred.y);
  });

  it('does not centre while moving diagonally', () => {
    const offCentre: MovementPointState = { x: 2.5 * TILE, y: 2.05 * TILE, row: 2, col: 2 };
    const diagonal = Math.SQRT1_2;
    const result = resolveMovementStep(offCentre, input(diagonal, diagonal), ctxFor(open));

    // Vertical change comes purely from the diagonal input, not from a pull
    // toward the tile centre below.
    expect(result.y - offCentre.y).toBeCloseTo(diagonal * WALK_SPEED * MOVEMENT_STEP_SECONDS, 6);
  });
});

// ---------------------------------------------------------------------------
// corner assist
// ---------------------------------------------------------------------------

describe('resolveMovementStep — corner assist', () => {
  // Moving right from (1,0); (1,1) is blocked but (0,1) is open, and (0,0) is
  // reachable — a corner the player is only slightly misaligned with.
  const corner = ['..', '.#'];

  it('nudges the character around a nearly-aligned corner', () => {
    const slightlyHigh: MovementPointState = {
      x: 0.5 * TILE,
      y: (1 + CORNER_ASSIST_MAX_OFFSET_TILES / 2) * TILE,
      row: 1,
      col: 0,
    };
    const result = simulate(slightlyHigh, input(1, 0), ctxFor(corner), 400);

    expect(result.row).toBe(0);
    expect(result.col).toBe(1);
  });

  it('does not fire when the character is too far from the opening', () => {
    const centred = atTileCenter(1, 0); // offset 0.5 > CORNER_ASSIST_MAX_OFFSET_TILES
    const result = simulate(centred, input(1, 0), ctxFor(corner), 60);

    expect(result.row).toBe(1);
    expect(result.blockedX).toBe(true);
  });

  it('does not fire when the tile past the wall is blocked', () => {
    const deadEnd = ['.#', '.#'];
    const slightlyHigh: MovementPointState = {
      x: 0.5 * TILE,
      y: (1 + CORNER_ASSIST_MAX_OFFSET_TILES / 2) * TILE,
      row: 1,
      col: 0,
    };
    const result = simulate(slightlyHigh, input(1, 0), ctxFor(deadEnd), 400);

    expect(result.row).toBe(1);
    expect(result.col).toBe(0);
  });

  it('does not fire while the perpendicular axis has input', () => {
    const slightlyHigh: MovementPointState = {
      x: 0.5 * TILE,
      y: (1 + CORNER_ASSIST_MAX_OFFSET_TILES / 2) * TILE,
      row: 1,
      col: 0,
    };
    const diagonal = Math.SQRT1_2;
    // Steering down-right: the player is deliberately pushing away from the gap.
    const result = simulate(slightlyHigh, input(diagonal, diagonal), ctxFor(corner), 60);

    expect(result.col).toBe(0);
  });
});
