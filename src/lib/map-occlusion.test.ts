import { describe, expect, it } from 'vitest';
import {
  buildOcclusionGrid,
  collectOccludingCells,
  getCharacterFrameViewportRect,
  getCharacterOcclusionBox,
} from './map-occlusion';
import { getCharacterSpriteMetrics } from './character-sprite';
import type { TilemapData, TilemapLayer } from '~/types/tilemap';
import type { MapPixelBox } from '~/types/map-occlusion';

const TILE = 16;
const FLIP_H = 0x80000000;

/** Builds a layer from rows of digits: `.` is empty, any digit is that GID. */
function layer(name: string, rows: string[]): TilemapLayer {
  const data = rows.flatMap((row) => [...row].map((char) => (char === '.' ? 0 : Number(char))));
  return {
    name,
    data,
    width: rows[0].length,
    height: rows.length,
    id: 0,
    opacity: 1,
    type: 'tilelayer',
    visible: true,
    x: 0,
    y: 0,
  };
}

function makeMap(layers: TilemapLayer[]): TilemapData {
  return { compressionlevel: -1, width: layers[0].width, height: layers[0].height, infinite: false, layers };
}

/** The base row of (row, col), or -1. */
function baseAt(grid: ReturnType<typeof buildOcclusionGrid>, row: number, col: number): number {
  return grid.baseRows[row * grid.width + col];
}

/** A box covering exactly the given tile rows and columns. */
function tileBox(firstCol: number, lastCol: number, firstRow: number, lastRow: number): MapPixelBox {
  return { left: firstCol * TILE, right: (lastCol + 1) * TILE, top: firstRow * TILE, bottom: (lastRow + 1) * TILE };
}

const ROAD = layer('road', ['1111', '1111', '1111', '1111', '1111', '1111']);
// A 3-tall tree in column 1 (rows 1–3) and a 1-tall bush in column 3 (row 4).
const TREES = layer('trees', ['....', '.2..', '.2..', '.2..', '....', '....']);
const BUSHES = layer('bushes', ['....', '....', '....', '....', '...3', '....']);
const VISIBLE = ['road', 'trees', 'bushes'];

describe('buildOcclusionGrid', () => {
  it('marks nothing when no occluders are configured', () => {
    const grid = buildOcclusionGrid(makeMap([ROAD, TREES]), VISIBLE, [], []);
    expect(grid.occludingCellCount).toBe(0);
    expect(grid.baseRows.every((base) => base === -1)).toBe(true);
  });

  it('grounds every cell of a vertical run on its bottom row', () => {
    const grid = buildOcclusionGrid(makeMap([ROAD, TREES, BUSHES]), VISIBLE, ['trees', 'bushes'], []);
    expect(baseAt(grid, 1, 1)).toBe(3);
    expect(baseAt(grid, 2, 1)).toBe(3);
    expect(baseAt(grid, 3, 1)).toBe(3);
    expect(baseAt(grid, 4, 3)).toBe(4);
    expect(baseAt(grid, 0, 1)).toBe(-1);
    expect(baseAt(grid, 4, 1)).toBe(-1);
    expect(grid.occludingCellCount).toBe(4);
  });

  it('keeps separate objects in one column apart', () => {
    const stacked = layer('trees', ['.', '2', '.', '2', '2', '.']);
    const grid = buildOcclusionGrid(makeMap([stacked]), ['trees'], ['trees'], []);
    expect(baseAt(grid, 1, 0)).toBe(1);
    expect(baseAt(grid, 3, 0)).toBe(4);
    expect(baseAt(grid, 4, 0)).toBe(4);
  });

  it('grounds each layer on its own run, keeping the southernmost base where they overlap', () => {
    // A tree on rows 0–3 and, on another layer, a bush on rows 3–5 in the same column.
    const tree = layer('trees', ['2', '2', '2', '2', '.', '.']);
    const bush = layer('bushes', ['.', '.', '.', '3', '3', '3']);
    const grid = buildOcclusionGrid(makeMap([tree, bush]), ['trees', 'bushes'], ['trees', 'bushes'], []);
    expect(baseAt(grid, 0, 0)).toBe(3);
    expect(baseAt(grid, 2, 0)).toBe(3);
    expect(baseAt(grid, 3, 0)).toBe(5);
    expect(baseAt(grid, 5, 0)).toBe(5);
    expect(grid.occludingCellCount).toBe(6);
  });

  it('records the lowest occluding layer per cell', () => {
    const overlap = layer('bushes', ['....', '.3..', '....', '....', '....', '....']);
    const grid = buildOcclusionGrid(makeMap([ROAD, TREES, overlap]), VISIBLE, ['trees', 'bushes'], []);
    expect(grid.startLayers[1 * grid.width + 1]).toBe(1);
  });

  it('ignores layers that are not drawn', () => {
    const grid = buildOcclusionGrid(makeMap([ROAD, TREES]), ['road'], ['trees'], []);
    expect(grid.occludingCellCount).toBe(0);
  });

  it('treats overhead GIDs on any layer as occluders, flip bits ignored', () => {
    const arch = layer('castle', ['....', '....', '..5.', '....', '....', '....']);
    arch.data[2 * 4 + 2] = 5 | FLIP_H;
    const grid = buildOcclusionGrid(makeMap([ROAD, arch]), ['road', 'castle'], [], [5]);
    expect(baseAt(grid, 2, 2)).toBe(2);
    expect(grid.startLayers[2 * grid.width + 2]).toBe(1);
    expect(grid.occludingCellCount).toBe(1);
  });
});

describe('collectOccludingCells', () => {
  const grid = buildOcclusionGrid(makeMap([ROAD, TREES, BUSHES]), VISIBLE, ['trees', 'bushes'], []);
  const out: number[] = [];

  it('covers the whole tree when the character stands behind it', () => {
    // Feet on row 2, inside the tree's run (ground row 3); body reaches up to row 0.
    const count = collectOccludingCells(grid, TILE, tileBox(0, 2, 0, 2), 2, out);
    expect(out.slice(0, count).sort((a, b) => a - b)).toEqual([1 * 4 + 1, 2 * 4 + 1]);
  });

  it('covers nothing when the character stands in front of the tree', () => {
    // Feet on row 4, south of the trunk; her head overlaps rows 2–3 of the tree.
    const count = collectOccludingCells(grid, TILE, tileBox(0, 2, 2, 4), 4, out);
    expect(count).toBe(0);
  });

  it('covers her legs when she stands in a bush', () => {
    const count = collectOccludingCells(grid, TILE, tileBox(2, 3, 2, 4), 4, out);
    expect(out.slice(0, count)).toEqual([4 * 4 + 3]);
  });

  it('clamps the box to the map edges', () => {
    const box: MapPixelBox = { left: -40, right: 200, top: -40, bottom: 200 };
    const count = collectOccludingCells(grid, TILE, box, 0, out);
    expect(count).toBe(grid.occludingCellCount);
  });

  it('collects nothing on a map without occluders', () => {
    const empty = buildOcclusionGrid(makeMap([ROAD]), ['road'], [], []);
    expect(collectOccludingCells(empty, TILE, tileBox(0, 3, 0, 5), 0, out)).toBe(0);
  });
});

describe('getCharacterOcclusionBox', () => {
  it('spans the sprite frame from its bottom edge up, centred on the collision point', () => {
    const metrics = getCharacterSpriteMetrics(TILE, 2.5, 1, 0.25);
    const box = getCharacterOcclusionBox(40, 40, metrics, { left: 0, top: 0, right: 0, bottom: 0 });
    const frameBottom = 40 + metrics.footOffsetPx + metrics.baselinePadPx;
    expect(box.bottom).toBeCloseTo(frameBottom);
    expect(box.top).toBeCloseTo(frameBottom - metrics.frameSizePx);
    expect(box.right - box.left).toBeCloseTo(metrics.frameSizePx);
    expect((box.left + box.right) / 2).toBeCloseTo(40);
  });
});

describe('getCharacterFrameViewportRect', () => {
  // `MapCharacterSprite` sizes itself from metrics at the map's zoom; the canvas copy derives
  // the same rect from zoom-1 metrics. Both must land on the same pixels.
  it.each([
    [16, 2.5, 0.25, 1],
    [16, 2.5, 0.25, 2],
    [32, 1.25, 0.25, 3],
  ])('matches the DOM sprite (tile %ipx, body %f tiles, foot %f, zoom %i)', (tileSize, body, foot, zoom) => {
    const mapMetrics = getCharacterSpriteMetrics(tileSize, body, 1, foot);
    const domMetrics = getCharacterSpriteMetrics(tileSize, body, zoom, foot);
    const translation = { x: 120, y: 90 };
    const rect = getCharacterFrameViewportRect(translation, mapMetrics, zoom, { x: 0, y: 0, width: 0, height: 0 });

    const domBottom = translation.y + Math.round(domMetrics.footOffsetPx + domMetrics.baselinePadPx);
    expect(rect.width).toBeCloseTo(domMetrics.frameSizePx);
    expect(rect.height).toBeCloseTo(domMetrics.frameSizePx);
    expect(rect.y + rect.height).toBeCloseTo(domBottom);
    expect(rect.x + rect.width / 2).toBeCloseTo(translation.x);
  });
});
