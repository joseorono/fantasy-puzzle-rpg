import { describe, expect, it } from 'vitest';
import { buildMinimapOutlinePath, loopToSmoothPath, traceWalkableOutline, type OutlinePoint } from './minimap-outline';
import type { WalkableMask } from './tilemap-collision';

/** Builds a mask from rows of '#' (walkable) and '.' (blocked). */
function maskFrom(rows: string[]): WalkableMask {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8Array(width * height);
  rows.forEach((line, row) => {
    [...line].forEach((cell, col) => {
      if (cell === '#') data[row * width + col] = 1;
    });
  });
  return { data, width, height };
}

/** Shoelace area: positive for one winding, negative for the other. */
function signedArea(loop: OutlinePoint[]): number {
  let area = 0;
  loop.forEach((point, index) => {
    const next = loop[(index + 1) % loop.length];
    area += point.x * next.y - next.x * point.y;
  });
  return area / 2;
}

// ---------------------------------------------------------------------------
// traceWalkableOutline
// ---------------------------------------------------------------------------

describe('traceWalkableOutline', () => {
  it('traces a single tile as one four-corner loop', () => {
    const loops = traceWalkableOutline(maskFrom(['.#.', '...']));
    expect(loops).toEqual([
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
      ],
    ]);
  });

  it('drops collinear corners along a corridor', () => {
    const loops = traceWalkableOutline(maskFrom(['###']));
    expect(loops).toHaveLength(1);
    expect(loops[0]).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 0, y: 1 },
    ]);
  });

  it('winds holes the opposite way to the outer loop', () => {
    const loops = traceWalkableOutline(maskFrom(['###', '#.#', '###']));
    expect(loops).toHaveLength(2);
    const [outer, hole] = loops.map(signedArea);
    expect(Math.sign(outer)).toBe(-Math.sign(hole));
    expect(Math.abs(outer)).toBe(9);
    expect(Math.abs(hole)).toBe(1);
  });

  it('keeps tiles that touch only at a corner as separate loops', () => {
    const loops = traceWalkableOutline(maskFrom(['#.', '.#']));
    expect(loops).toHaveLength(2);
    loops.forEach((loop) => expect(loop).toHaveLength(4));
  });

  it('never repeats a corner within a loop', () => {
    const loops = traceWalkableOutline(
      maskFrom([
        '.####..', //
        '..##...',
        '.####.#',
        '#.#.###',
      ]),
    );
    for (const loop of loops) {
      const keys = new Set(loop.map((point) => `${point.x},${point.y}`));
      expect(keys.size).toBe(loop.length);
      expect(loop.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('returns nothing for a map with no walkable tiles', () => {
    expect(traceWalkableOutline(maskFrom(['..', '..']))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// loopToSmoothPath / buildMinimapOutlinePath
// ---------------------------------------------------------------------------

const CORRIDOR: OutlinePoint[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 0, y: 1 },
];

describe('loopToSmoothPath', () => {
  it('draws sharp corners with lines at rounding 0', () => {
    expect(loopToSmoothPath(CORRIDOR, 0)).toBe('M0 0L3 0L3 1L0 1Z');
  });

  it('draws every corner as a curve between edge midpoints at rounding 1', () => {
    const path = loopToSmoothPath(CORRIDOR, 1);
    expect(path).toBe('M0 0.5Q0 0 1.5 0Q3 0 3 0.5Q3 1 1.5 1Q0 1 0 0.5Z');
    expect(path).not.toContain('L');
  });

  it('pulls the curve ends toward the corner for partial rounding', () => {
    const path = loopToSmoothPath(CORRIDOR, 0.5);
    expect(path.startsWith('M0 0.25Q0 0 0.75 0L2.25 0Q3 0 3 0.25')).toBe(true);
  });

  it('ignores degenerate loops', () => {
    expect(loopToSmoothPath([{ x: 0, y: 0 }], 1)).toBe('');
  });
});

describe('buildMinimapOutlinePath', () => {
  const mask = maskFrom(['###', '#.#', '###']);

  it('closes one subpath per loop', () => {
    const path = buildMinimapOutlinePath(mask, 1);
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.match(/Z/g)).toHaveLength(2);
  });

  it('is deterministic', () => {
    expect(buildMinimapOutlinePath(mask)).toBe(buildMinimapOutlinePath(mask));
  });
});
