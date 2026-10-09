import { describe, expect, it } from 'vitest';
import {
  buildMinimapMarkers,
  getMinimapDockSide,
  getMinimapLayout,
  getMinimapLegend,
  mapPointToMinimapPercent,
  tileToMinimapPercent,
} from './minimap';
import type { MarkerStatus } from './map-draw';
import type { MapDefinition } from '~/types/map';
import { MAP_DIALOGUE_TRIGGER_WHITE_SYMBOL, MAP_NODE_MARKER_STYLES } from '~/constants/map';
import { MINIMAP_MAX_PX_PER_TILE, MINIMAP_MIN_PX_PER_TILE } from '~/constants/minimap';

// ---------------------------------------------------------------------------
// Docking + layout
// ---------------------------------------------------------------------------

describe('getMinimapDockSide', () => {
  it('docks on the side away from the character', () => {
    expect(getMinimapDockSide({ x: 40, y: 0 }, 10, 16)).toBe('right');
    expect(getMinimapDockSide({ x: 120, y: 0 }, 10, 16)).toBe('left');
  });
});

describe('getMinimapLayout', () => {
  it('docks a big map on a wide window at the map aspect ratio', () => {
    const layout = getMinimapLayout({ width: 1900, height: 950 }, 124, 76, 'right');
    expect(layout.side).toBe('right');
    expect(layout.sheet.width / layout.sheet.height).toBeCloseTo(124 / 76, 1);
    expect(layout.sheet.width).toBeLessThanOrEqual(1900 / 2);
  });

  it('caps small maps at the maximum pixels per tile', () => {
    const layout = getMinimapLayout({ width: 1900, height: 950 }, 30, 20, 'left');
    expect(layout).toEqual({
      side: 'left',
      sheet: { width: 30 * MINIMAP_MAX_PX_PER_TILE, height: 20 * MINIMAP_MAX_PX_PER_TILE },
    });
  });

  it('goes centre-stage when docking would drop below the minimum', () => {
    const layout = getMinimapLayout({ width: 600, height: 500 }, 124, 76, 'right');
    expect(layout.side).toBe('center');
    expect(layout.sheet.width / 124).toBeGreaterThanOrEqual(MINIMAP_MIN_PX_PER_TILE);
    expect(layout.sheet.width).toBeLessThanOrEqual(600);
  });

  it('draws at the minimum when nothing fits', () => {
    const layout = getMinimapLayout({ width: 200, height: 300 }, 124, 76, 'right');
    expect(layout).toEqual({
      side: 'center',
      sheet: { width: 124 * MINIMAP_MIN_PX_PER_TILE, height: 76 * MINIMAP_MIN_PX_PER_TILE },
    });
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

  it('keeps completed nodes, flagged, with the same symbol', () => {
    const chest = markers.find((marker) => marker.id === 'node-chest');
    expect(chest).toMatchObject({ isDone: true, symbol: 'chest' });
    expect(markers.find((marker) => marker.id === 'node-fight')).toMatchObject({ isDone: false, symbol: 'sword' });
  });

  it('pins triggers with a symbol and loot as a plain dot', () => {
    expect(markers.find((marker) => marker.kind === 'dialogueTrigger')?.symbol).toBe(MAP_DIALOGUE_TRIGGER_WHITE_SYMBOL);
    expect(markers.find((marker) => marker.kind === 'floorLoot')?.symbol).toBeUndefined();
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
    expect(legend[0].symbol).toBe(MAP_NODE_MARKER_STYLES.Town.whiteSymbol);
  });

  it('is empty for a map without nodes', () => {
    expect(getMinimapLegend(buildMinimapMarkers({ ...MAP, nodes: undefined }, STATUS))).toEqual([]);
  });
});
