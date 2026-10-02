import { describe, expect, it } from 'vitest';
import {
  agedEdgeFactor,
  buildMinimapMarkers,
  buildMinimapPixels,
  classifyMinimapTile,
  DEFAULT_MINIMAP_PALETTE,
  getMinimapLegend,
  getMinimapScale,
  mapPointToMinimapPercent,
  tileGrain,
  tileToMinimapPercent,
  type MinimapPalette,
} from './minimap';
import type { WalkableMask } from './tilemap-collision';
import type { MarkerStatus } from './map-draw';
import type { MapDefinition } from '~/types/map';
import { MAP_NODE_MARKER_STYLES } from '~/constants/map';

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

/** Reads one pixel's RGBA back out of a buffer. */
function pixelAt(pixels: Uint8ClampedArray, width: number, row: number, col: number): number[] {
  const offset = (row * width + col) * 4;
  return Array.from(pixels.slice(offset, offset + 4));
}

const MASK = maskFrom([
  '.......', //
  '.......',
  '..###..',
  '.......',
  '.......',
]);

// ---------------------------------------------------------------------------
// classifyMinimapTile
// ---------------------------------------------------------------------------

describe('classifyMinimapTile', () => {
  it('draws walkable tiles as paths', () => {
    expect(classifyMinimapTile(MASK, 2, 3)).toBe('path');
  });

  it('outlines blocked tiles touching a path, diagonals included', () => {
    expect(classifyMinimapTile(MASK, 1, 3)).toBe('edge'); // above
    expect(classifyMinimapTile(MASK, 2, 1)).toBe('edge'); // left
    expect(classifyMinimapTile(MASK, 3, 5)).toBe('edge'); // diagonal
  });

  it('leaves tiles away from paths blank', () => {
    expect(classifyMinimapTile(MASK, 0, 0)).toBe('blank');
    expect(classifyMinimapTile(MASK, 4, 6)).toBe('blank');
  });

  it('treats tiles past the map border as blocked', () => {
    const corner = maskFrom(['#.', '..']);
    expect(classifyMinimapTile(corner, 0, 0)).toBe('path');
    expect(classifyMinimapTile(corner, 1, 1)).toBe('edge');
  });
});

// ---------------------------------------------------------------------------
// tileGrain / agedEdgeFactor
// ---------------------------------------------------------------------------

describe('tileGrain', () => {
  it('is deterministic and within [-1, 1]', () => {
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 20; col++) {
        const grain = tileGrain(row, col);
        expect(grain).toBe(tileGrain(row, col));
        expect(grain).toBeGreaterThanOrEqual(-1);
        expect(grain).toBeLessThanOrEqual(1);
      }
    }
  });

  it('varies from tile to tile', () => {
    const values = new Set([tileGrain(0, 0), tileGrain(0, 1), tileGrain(1, 0), tileGrain(5, 9), tileGrain(9, 5)]);
    expect(values.size).toBeGreaterThan(3);
  });
});

describe('agedEdgeFactor', () => {
  it('is 1 on the border and 0 beyond the aged band', () => {
    expect(agedEdgeFactor(0, 10, 20, 20, 4)).toBe(1);
    expect(agedEdgeFactor(10, 19, 20, 20, 4)).toBe(1);
    expect(agedEdgeFactor(10, 10, 20, 20, 4)).toBe(0);
    expect(agedEdgeFactor(4, 10, 20, 20, 4)).toBe(0);
  });

  it('fades monotonically toward the inside', () => {
    const band = [0, 1, 2, 3, 4].map((row) => agedEdgeFactor(row, 10, 20, 20, 4));
    for (let index = 1; index < band.length; index++) expect(band[index]).toBeLessThan(band[index - 1]);
  });

  it('is off with no aged band', () => {
    expect(agedEdgeFactor(0, 0, 20, 20, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildMinimapPixels
// ---------------------------------------------------------------------------

describe('buildMinimapPixels', () => {
  const pixels = buildMinimapPixels(MASK);

  it('has one opaque RGBA pixel per tile', () => {
    expect(pixels.length).toBe(MASK.width * MASK.height * 4);
    for (let index = 3; index < pixels.length; index += 4) expect(pixels[index]).toBe(255);
  });

  it('paints paths and outlines in exactly the palette colours', () => {
    expect(pixelAt(pixels, MASK.width, 2, 3)).toEqual([...DEFAULT_MINIMAP_PALETTE.path, 255]);
    expect(pixelAt(pixels, MASK.width, 1, 3)).toEqual([...DEFAULT_MINIMAP_PALETTE.edge, 255]);
  });

  it('keeps blank parchment within the grain of its base colour', () => {
    const noAgeing: MinimapPalette = { ...DEFAULT_MINIMAP_PALETTE, agedEdgeTiles: 0 };
    const flat = buildMinimapPixels(MASK, noAgeing);
    const [red, green, blue] = pixelAt(flat, MASK.width, 0, 0);
    const base = DEFAULT_MINIMAP_PALETTE.parchment;
    const grain = DEFAULT_MINIMAP_PALETTE.grain;
    expect(Math.abs(red - base[0])).toBeLessThanOrEqual(grain);
    expect(Math.abs(green - base[1])).toBeLessThanOrEqual(grain);
    expect(Math.abs(blue - base[2])).toBeLessThanOrEqual(grain);
    // The same offset on every channel, so grain shifts brightness, not hue.
    expect(red - base[0]).toBe(green - base[1]);
  });

  it('draws the same map the same way every time', () => {
    expect(buildMinimapPixels(MASK)).toEqual(pixels);
  });
});

// ---------------------------------------------------------------------------
// getMinimapScale
// ---------------------------------------------------------------------------

describe('getMinimapScale', () => {
  it('picks the largest whole scale that fits', () => {
    expect(getMinimapScale({ width: 900, height: 600 }, 124, 76, 2, 8)).toBe(7);
  });

  it('caps small maps at the maximum', () => {
    expect(getMinimapScale({ width: 1800, height: 1000 }, 45, 30, 2, 8)).toBe(8);
  });

  it('falls back to the minimum when even that overflows', () => {
    expect(getMinimapScale({ width: 100, height: 100 }, 124, 76, 2, 8)).toBe(2);
    expect(getMinimapScale({ width: -50, height: 300 }, 124, 76, 2, 8)).toBe(2);
  });

  it('handles an empty map', () => {
    expect(getMinimapScale({ width: 900, height: 600 }, 0, 0, 2, 8)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

describe('positions', () => {
  it('places a map-pixel point as a percentage of the map', () => {
    expect(mapPointToMinimapPercent({ x: 80, y: 40 }, 10, 5, 16)).toEqual({ left: 50, top: 50 });
  });

  it('places a tile at its centre', () => {
    expect(tileToMinimapPercent(1, 3, 10, 5)).toEqual({ left: (3.5 / 10) * 100, top: (1.5 / 5) * 100 });
  });

  it('agrees with the map-pixel form at a tile centre', () => {
    const tileSize = 16;
    const fromPoint = mapPointToMinimapPercent({ x: 3.5 * tileSize, y: 1.5 * tileSize }, 10, 5, tileSize);
    expect(fromPoint).toEqual(tileToMinimapPercent(1, 3, 10, 5));
  });
});

// ---------------------------------------------------------------------------
// Markers + legend
// ---------------------------------------------------------------------------

const MAP: MapDefinition = {
  id: 'map-00',
  tilesetImage: '',
  displayMapName: 'Test',
  walkableLayers: [],
  visibleLayers: [],
  defaultPlayerPosition: { x: 0, y: 0 },
  tiledData: { compressionlevel: -1, height: 5, width: 7, infinite: false, layers: [] },
  nodes: [
    { id: 'fight', type: 'Battle', position: { row: 2, col: 3 }, name: 'Fight', blocksMovement: true },
    { id: 'chest', type: 'Treasure', position: { row: 1, col: 1 }, name: 'Chest', blocksMovement: false },
    { id: 'inn', type: 'Town', position: { row: 4, col: 6 }, name: 'Inn', blocksMovement: false },
  ],
  floorLoot: [
    { id: 'coins', position: { row: 0, col: 2 }, maxValues: { coins: 5, gold: 0, copper: 0, silver: 0, iron: 0 } },
    { id: 'taken', position: { row: 0, col: 3 }, maxValues: { coins: 5, gold: 0, copper: 0, silver: 0, iron: 0 } },
  ],
  dialogueTriggers: [
    { row: 3, col: 0, scene: 'seen' },
    { row: 3, col: 6, scene: 'new' },
  ],
};

const STATUS: MarkerStatus = {
  isNodeCompleted: (node) => node.id === 'chest',
  isFloorLootCollected: (lootId) => lootId === 'taken',
  isTriggerVisited: (row, col) => row === 3 && col === 0,
};

describe('buildMinimapMarkers', () => {
  const markers = buildMinimapMarkers(MAP, STATUS);

  it('keeps completed nodes, flagged, with their completed glyph', () => {
    const chest = markers.find((marker) => marker.id === 'node-chest');
    expect(chest).toMatchObject({ isDone: true, icon: MAP_NODE_MARKER_STYLES.Treasure.doneIcon });
    expect(markers.find((marker) => marker.id === 'node-fight')).toMatchObject({ isDone: false, icon: '⚔' });
  });

  it('leaves out collected loot and visited triggers', () => {
    expect(markers.filter((marker) => marker.kind === 'floorLoot').map((marker) => marker.id)).toEqual(['loot-coins']);
    expect(markers.filter((marker) => marker.kind === 'dialogueTrigger').map((marker) => marker.id)).toEqual([
      'trigger-3-6',
    ]);
  });

  it('gives every marker a unique key', () => {
    expect(new Set(markers.map((marker) => marker.id)).size).toBe(markers.length);
  });
});

describe('getMinimapLegend', () => {
  it('lists only the node types present, in a fixed order', () => {
    const legend = getMinimapLegend(buildMinimapMarkers(MAP, STATUS));
    expect(legend.map((entry) => entry.type)).toEqual(['Town', 'Battle', 'Treasure']);
    expect(legend[0].icon).toBe(MAP_NODE_MARKER_STYLES.Town.icon);
  });

  it('is empty for a map without nodes', () => {
    expect(getMinimapLegend(buildMinimapMarkers({ ...MAP, nodes: undefined }, STATUS))).toEqual([]);
  });
});
