import { describe, expect, it } from 'vitest';
import { buildWalkableMask, findFirstWalkableTile, isMaskWalkable } from './tilemap-collision';
import type { TilemapData, TilemapLayer } from '~/types/tilemap';

function layer(name: string, width: number, height: number, data: number[]): TilemapLayer {
  return {
    name,
    width,
    height,
    data,
    id: 1,
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    x: 0,
    y: 0,
  };
}

/** 3×2 map: one road layer with a gap in the middle of the top row. */
function makeMap(layers: TilemapLayer[]): TilemapData {
  return {
    compressionlevel: -1,
    height: 2,
    infinite: false,
    width: 3,
    layers,
  };
}

describe('buildWalkableMask', () => {
  it('marks non-zero tiles from the named layer as walkable', () => {
    const mask = buildWalkableMask(makeMap([layer('road', 3, 2, [1, 0, 1, 0, 0, 2])]), ['road']);

    expect(Array.from(mask.data)).toEqual([1, 0, 1, 0, 0, 1]);
    expect(mask.width).toBe(3);
    expect(mask.height).toBe(2);
  });

  it('unions multiple walkable layers', () => {
    const mask = buildWalkableMask(
      makeMap([layer('walkable', 3, 2, [1, 0, 0, 0, 0, 0]), layer('walkable-2', 3, 2, [0, 0, 0, 0, 5, 0])]),
      ['walkable', 'walkable-2'],
    );

    expect(Array.from(mask.data)).toEqual([1, 0, 0, 0, 1, 0]);
  });

  it('ignores layers that are not named', () => {
    const mask = buildWalkableMask(
      makeMap([layer('road', 3, 2, [1, 0, 0, 0, 0, 0]), layer('trees', 3, 2, [0, 9, 9, 9, 9, 9])]),
      ['road'],
    );

    expect(Array.from(mask.data)).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it('produces an all-blocked mask when no named layer exists', () => {
    const mask = buildWalkableMask(makeMap([layer('road', 3, 2, [1, 1, 1, 1, 1, 1])]), ['missing']);
    expect(Array.from(mask.data)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('isMaskWalkable', () => {
  const mask = buildWalkableMask(makeMap([layer('road', 3, 2, [1, 0, 1, 0, 0, 1])]), ['road']);

  it('reads the mask row-major', () => {
    expect(isMaskWalkable(mask, 0, 0)).toBe(true);
    expect(isMaskWalkable(mask, 0, 1)).toBe(false);
    expect(isMaskWalkable(mask, 1, 2)).toBe(true);
  });

  it('treats out-of-bounds tiles as blocked', () => {
    expect(isMaskWalkable(mask, -1, 0)).toBe(false);
    expect(isMaskWalkable(mask, 0, -1)).toBe(false);
    expect(isMaskWalkable(mask, 2, 0)).toBe(false);
    expect(isMaskWalkable(mask, 0, 3)).toBe(false);
  });
});

describe('findFirstWalkableTile', () => {
  it('returns the first walkable tile in row-major order', () => {
    const mask = buildWalkableMask(makeMap([layer('road', 3, 2, [0, 0, 1, 1, 0, 0])]), ['road']);
    expect(findFirstWalkableTile(mask)).toEqual({ row: 0, col: 2 });
  });

  it('returns null when nothing is walkable', () => {
    const mask = buildWalkableMask(makeMap([layer('road', 3, 2, [0, 0, 0, 0, 0, 0])]), ['road']);
    expect(findFirstWalkableTile(mask)).toBeNull();
  });
});
