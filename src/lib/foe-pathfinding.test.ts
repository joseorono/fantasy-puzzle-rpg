import { describe, expect, it } from 'vitest';
import { createTilePathfinder, hasLineOfSight, smoothPath } from './foe-pathfinding';

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

function pathfinderFor(rows: string[]) {
  return { finder: createTilePathfinder(rows[0].length, rows.length), isWalkable: gridWalkable(rows) };
}

describe('createTilePathfinder', () => {
  it('finds the shortest 4-connected path, excluding the start and including the goal', () => {
    const rows = ['.....', '.###.', '.....'];
    const { finder, isWalkable } = pathfinderFor(rows);

    const path = finder.findPath({ row: 0, col: 0 }, { row: 2, col: 0 }, isWalkable);

    expect(path).toEqual([
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ]);
  });

  it('routes around a wall', () => {
    const rows = ['.....', '####.', '.....'];
    const { finder, isWalkable } = pathfinderFor(rows);

    const path = finder.findPath({ row: 0, col: 0 }, { row: 2, col: 0 }, isWalkable);

    // Across the top, down the gap, back along the bottom: 4 + 2 + 4 steps.
    expect(path).not.toBeNull();
    expect(path).toHaveLength(10);
    expect(path![path!.length - 1]).toEqual({ row: 2, col: 0 });
    for (const tile of path!) expect(isWalkable(tile.row, tile.col)).toBe(true);
  });

  it('returns an empty path when already at the goal', () => {
    const { finder, isWalkable } = pathfinderFor(['...']);
    expect(finder.findPath({ row: 0, col: 1 }, { row: 0, col: 1 }, isWalkable)).toEqual([]);
  });

  it('returns null when the goal is walled off', () => {
    const rows = ['..#.', '..#.', '..#.'];
    const { finder, isWalkable } = pathfinderFor(rows);
    expect(finder.findPath({ row: 0, col: 0 }, { row: 0, col: 3 }, isWalkable)).toBeNull();
  });

  it('returns null when the goal tile itself is blocked or out of bounds', () => {
    const rows = ['..#'];
    const { finder, isWalkable } = pathfinderFor(rows);
    expect(finder.findPath({ row: 0, col: 0 }, { row: 0, col: 2 }, isWalkable)).toBeNull();
    expect(finder.findPath({ row: 0, col: 0 }, { row: 5, col: 0 }, isWalkable)).toBeNull();
  });

  it('never cuts a diagonal corner between two blocked tiles', () => {
    // Only diagonal adjacency between (0,0) and (1,1); no 4-connected route.
    const rows = ['.#', '#.'];
    const { finder, isWalkable } = pathfinderFor(rows);
    expect(finder.findPath({ row: 0, col: 0 }, { row: 1, col: 1 }, isWalkable)).toBeNull();
  });

  it('gives up once the node budget is spent', () => {
    const rows = Array.from({ length: 20 }, () => '.'.repeat(20));
    const { finder, isWalkable } = pathfinderFor(rows);

    expect(finder.findPath({ row: 0, col: 0 }, { row: 19, col: 19 }, isWalkable, 5)).toBeNull();
    expect(finder.findPath({ row: 0, col: 0 }, { row: 19, col: 19 }, isWalkable)).toHaveLength(38);
  });

  it('reuses its buffers across searches without leaking visited state', () => {
    const rows = ['.....', '.###.', '.....'];
    const { finder, isWalkable } = pathfinderFor(rows);

    const first = finder.findPath({ row: 0, col: 0 }, { row: 2, col: 4 }, isWalkable);
    const second = finder.findPath({ row: 0, col: 0 }, { row: 2, col: 4 }, isWalkable);
    const reversed = finder.findPath({ row: 2, col: 4 }, { row: 0, col: 0 }, isWalkable);

    expect(second).toEqual(first);
    expect(reversed).toHaveLength(first!.length);
  });

  it('does not require the start tile to be walkable', () => {
    const rows = ['#..'];
    const { finder, isWalkable } = pathfinderFor(rows);
    expect(finder.findPath({ row: 0, col: 0 }, { row: 0, col: 2 }, isWalkable)).toEqual([
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });
});

/** Tile centre in tile units, as `hasLineOfSight` and `smoothPath` take points. */
function centre(row: number, col: number) {
  return { x: col + 0.5, y: row + 0.5 };
}

describe('hasLineOfSight', () => {
  const OPEN = ['.....', '.....', '.....', '.....', '.....'];

  it('sees across an open field at any angle', () => {
    const isWalkable = gridWalkable(OPEN);
    expect(hasLineOfSight(centre(0, 0), centre(4, 4), isWalkable)).toBe(true);
    expect(hasLineOfSight(centre(0, 0), centre(1, 4), isWalkable)).toBe(true);
  });

  it('is blocked by a wall tile on the segment', () => {
    const isWalkable = gridWalkable(['.....', '.....', '..#..', '.....', '.....']);
    expect(hasLineOfSight(centre(0, 0), centre(4, 4), isWalkable)).toBe(false);
  });

  it('never squeezes through a corner between two diagonal walls', () => {
    const isWalkable = gridWalkable(['.#', '#.']);
    expect(hasLineOfSight(centre(0, 0), centre(1, 1), isWalkable)).toBe(false);
  });

  it('runs along a wall edge without touching it', () => {
    const isWalkable = gridWalkable(['.....', '#####']);
    expect(hasLineOfSight(centre(0, 0), centre(0, 4), isWalkable)).toBe(true);
  });

  it('is blocked when the end tile itself is blocked', () => {
    const isWalkable = gridWalkable(['...#']);
    expect(hasLineOfSight(centre(0, 0), centre(0, 3), isWalkable)).toBe(false);
  });
});

describe('smoothPath', () => {
  it('collapses an open-field route into a single straight leg to the goal', () => {
    const rows = ['......', '......', '......', '......', '......', '......'];
    const { finder, isWalkable } = pathfinderFor(rows);
    const path = finder.findPath({ row: 0, col: 0 }, { row: 5, col: 5 }, isWalkable)!;

    expect(smoothPath(centre(0, 0), path, isWalkable)).toEqual([{ row: 5, col: 5 }]);
  });

  it('keeps only the turns needed to get around a wall, all walkable, ending on the goal', () => {
    const rows = ['......', '.####.', '......'];
    const { finder, isWalkable } = pathfinderFor(rows);
    const path = finder.findPath({ row: 0, col: 2 }, { row: 2, col: 3 }, isWalkable)!;
    const smoothed = smoothPath(centre(0, 2), path, isWalkable);

    expect(smoothed.length).toBeLessThan(path.length);
    expect(smoothed[smoothed.length - 1]).toEqual({ row: 2, col: 3 });
    let anchor = centre(0, 2);
    for (const tile of smoothed) {
      expect(isWalkable(tile.row, tile.col)).toBe(true);
      expect(hasLineOfSight(anchor, centre(tile.row, tile.col), isWalkable)).toBe(true);
      anchor = centre(tile.row, tile.col);
    }
  });

  it('returns an empty path unchanged', () => {
    expect(smoothPath(centre(0, 0), [], () => true)).toEqual([]);
  });
});
