import { describe, expect, it } from 'vitest';
import {
  buildMarkerList,
  getMarkerPulsePhase,
  isMarkerInView,
  type MapMarker,
  type MarkerStatus,
  type NodeMarker,
} from './map-draw';
import type { MapDefinition } from '~/types/map';
import type { TilemapData } from '~/types/tilemap';
import {
  MAP_MARKER_CULL_MARGIN_PX,
  MAP_MARKER_PULSE_RADIANS_PER_SECOND,
  MAP_NODE_MARKER_SIZE,
  MAP_NODE_MARKER_STYLES,
} from '~/constants/map';

const TILE = 16;

const EMPTY_TILED: TilemapData = { compressionlevel: -1, height: 10, width: 10, infinite: false, layers: [] };

const MAP: MapDefinition = {
  id: 'map-00',
  tilesetImage: '',
  displayMapName: 'Test',
  walkableLayers: [],
  visibleLayers: [],
  defaultPlayerPosition: { x: 0, y: 0 },
  tiledData: EMPTY_TILED,
  nodes: [
    { id: 'fight', type: 'Battle', position: { row: 2, col: 3 }, name: 'Fight', blocksMovement: true },
    { id: 'chest', type: 'Treasure', position: { row: 4, col: 4 }, name: 'Chest', blocksMovement: false },
  ],
  floorLoot: [
    { id: 'coins', position: { row: 5, col: 5 }, maxValues: { coins: 5, gold: 0, copper: 0, silver: 0, iron: 0 } },
    { id: 'taken', position: { row: 6, col: 6 }, maxValues: { coins: 5, gold: 0, copper: 0, silver: 0, iron: 0 } },
  ],
  dialogueTriggers: [
    { row: 1, col: 1, scene: 'intro' },
    { row: 7, col: 7, scene: 'later' },
  ],
};

const STATUS: MarkerStatus = {
  isNodeCompleted: (node) => node.id === 'chest',
  isFloorLootCollected: (lootId) => lootId === 'taken',
  isTriggerVisited: (row, col) => row === 1 && col === 1,
};

function find<K extends MapMarker['kind']>(markers: MapMarker[], kind: K): Extract<MapMarker, { kind: K }>[] {
  return markers.filter((marker): marker is Extract<MapMarker, { kind: K }> => marker.kind === kind);
}

// ---------------------------------------------------------------------------
// buildMarkerList
// ---------------------------------------------------------------------------

describe('buildMarkerList', () => {
  const markers = buildMarkerList(MAP, TILE, STATUS);

  it('lists every node, flagging completed ones', () => {
    const nodes = find(markers, 'node');
    expect(nodes.map((node) => [node.isDone, node.style])).toEqual([
      [false, MAP_NODE_MARKER_STYLES.Battle],
      [true, MAP_NODE_MARKER_STYLES.Treasure],
    ]);
  });

  it('centres a node marker bigger than its tile on that tile', () => {
    const [fight] = find(markers, 'node') as NodeMarker[];
    expect(fight.size).toBe(MAP_NODE_MARKER_SIZE);
    expect(fight.x + fight.size / 2).toBe(3 * TILE + TILE / 2);
    expect(fight.y + fight.size / 2).toBe(2 * TILE + TILE / 2);
  });

  it('leaves out collected floor loot', () => {
    expect(find(markers, 'floorLoot').map((loot) => [loot.x, loot.y])).toEqual([[5 * TILE, 5 * TILE]]);
  });

  it('flags visited dialogue triggers', () => {
    expect(find(markers, 'dialogueTrigger').map((trigger) => trigger.isDone)).toEqual([true, false]);
  });

  it('grows each tile by the cull margin', () => {
    const [loot] = find(markers, 'floorLoot');
    expect(loot.bounds).toEqual({
      left: 5 * TILE - MAP_MARKER_CULL_MARGIN_PX,
      top: 5 * TILE - MAP_MARKER_CULL_MARGIN_PX,
      right: 6 * TILE + MAP_MARKER_CULL_MARGIN_PX,
      bottom: 6 * TILE + MAP_MARKER_CULL_MARGIN_PX,
    });
  });

  it('handles a map with no content', () => {
    expect(
      buildMarkerList({ ...MAP, nodes: undefined, floorLoot: undefined, dialogueTriggers: undefined }, TILE, STATUS),
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isMarkerInView
// ---------------------------------------------------------------------------

describe('isMarkerInView', () => {
  const view = { viewWidth: 320, viewHeight: 240 };
  const marker: MapMarker = {
    kind: 'floorLoot',
    x: 0,
    y: 0,
    size: TILE,
    bounds: { left: 1000, top: 1000, right: 1100, bottom: 1100 },
  };

  it('shows a marker inside the view', () => {
    expect(isMarkerInView(marker, { x: 900, y: 900 }, view)).toBe(true);
  });

  it('hides a marker past each edge', () => {
    expect(isMarkerInView(marker, { x: 1100, y: 900 }, view)).toBe(false); // view right of it
    expect(isMarkerInView(marker, { x: 600, y: 900 }, view)).toBe(false); // view left of it
    expect(isMarkerInView(marker, { x: 900, y: 1100 }, view)).toBe(false); // view below it
    expect(isMarkerInView(marker, { x: 900, y: 700 }, view)).toBe(false); // view above it
  });

  it('shows a marker whose glow straddles an edge', () => {
    expect(isMarkerInView(marker, { x: 1050, y: 1050 }, view)).toBe(true);
    expect(isMarkerInView(marker, { x: 700, y: 900 }, view)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMarkerPulsePhase
// ---------------------------------------------------------------------------

describe('getMarkerPulsePhase', () => {
  it('stays within one turn', () => {
    for (const ms of [0, 123, 4567, 98765, 1e9]) {
      const phase = getMarkerPulsePhase(ms);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(Math.PI * 2);
    }
  });

  it('advances with time, not frames', () => {
    expect(getMarkerPulsePhase(500)).toBeCloseTo(0.5 * MAP_MARKER_PULSE_RADIANS_PER_SECOND, 9);
  });

  it('repeats every full turn', () => {
    const periodMs = ((Math.PI * 2) / MAP_MARKER_PULSE_RADIANS_PER_SECOND) * 1000;
    expect(getMarkerPulsePhase(250 + periodMs)).toBeCloseTo(getMarkerPulsePhase(250), 6);
  });
});
