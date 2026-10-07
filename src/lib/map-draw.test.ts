import { describe, expect, it } from 'vitest';
import {
  buildMarkerList,
  decodeTileGid,
  getMapMarkerScale,
  getMarkerBobOffset,
  getMarkerPulsePhase,
  getNodeMarkerState,
  getTileFlipMatrix,
  isMarkerInView,
  type MapMarker,
  type MarkerStatus,
  type TileFlips,
} from './map-draw';
import type { MapDefinition } from '~/types/map';
import type { TilemapData } from '~/types/tilemap';
import {
  MAP_MARKER_BOB_PX,
  MAP_MARKER_CHECK,
  MAP_MARKER_CULL_MARGIN_PX,
  MAP_MARKER_FLOAT_LIFT_PX,
  MAP_MARKER_PLATE_LIFT_PX,
  MAP_MARKER_PLATE_SIZE_PX,
  MAP_MARKER_PULSE_RADIANS_PER_SECOND,
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
// getMapMarkerScale / getNodeMarkerState
// ---------------------------------------------------------------------------

describe('getMapMarkerScale', () => {
  it('draws native size on 16px tiles and whole multiples on bigger ones', () => {
    expect(getMapMarkerScale(16)).toBe(1);
    expect(getMapMarkerScale(32)).toBe(2);
    expect(getMapMarkerScale(48)).toBe(3);
  });

  it('never drops below native size', () => {
    expect(getMapMarkerScale(8)).toBe(1);
  });
});

describe('getNodeMarkerState', () => {
  it('stays todo until done, whoever stands on it', () => {
    expect(getNodeMarkerState(false, false)).toBe('todo');
    expect(getNodeMarkerState(false, true)).toBe('todo');
  });

  it('greys out once done and relights while occupied', () => {
    expect(getNodeMarkerState(true, false)).toBe('done');
    expect(getNodeMarkerState(true, true)).toBe('doneActive');
  });
});

// ---------------------------------------------------------------------------
// buildMarkerList
// ---------------------------------------------------------------------------

describe('buildMarkerList', () => {
  const markers = buildMarkerList(MAP, TILE, STATUS);

  it('lists every node with its type and state', () => {
    expect(find(markers, 'node').map((node) => [node.nodeType, node.state])).toEqual([
      ['Battle', 'todo'],
      ['Treasure', 'done'],
    ]);
  });

  it('relights a completed node the character stands on', () => {
    const occupied = buildMarkerList(MAP, TILE, STATUS, { row: 4, col: 4 });
    expect(find(occupied, 'node').map((node) => node.state)).toEqual(['todo', 'doneActive']);
  });

  it('centres a plate on its tile, standing on the tile bottom', () => {
    const [fight] = find(markers, 'node');
    expect(fight.scale).toBe(1);
    expect(fight.x + MAP_MARKER_PLATE_SIZE_PX / 2).toBe(3 * TILE + TILE / 2);
    expect(fight.y).toBe(2 * TILE - MAP_MARKER_PLATE_LIFT_PX);
    expect(fight.y + MAP_MARKER_PLATE_SIZE_PX).toBe(3 * TILE);
  });

  it('scales the plate by whole numbers on 32px tiles', () => {
    const [fight] = find(buildMarkerList(MAP, 32, STATUS), 'node');
    const plateSize = MAP_MARKER_PLATE_SIZE_PX * 2;
    expect(fight.scale).toBe(2);
    expect(fight.x + plateSize / 2).toBe(3 * 32 + 16);
    expect(fight.y + plateSize).toBe(3 * 32);
  });

  it('floats uncollected loot above its tile and leaves out collected loot', () => {
    expect(find(markers, 'floorLoot').map((loot) => [loot.x, loot.y])).toEqual([
      [5 * TILE, 5 * TILE - MAP_MARKER_FLOAT_LIFT_PX],
    ]);
  });

  it('leaves out visited dialogue triggers', () => {
    expect(find(markers, 'dialogueTrigger').map((trigger) => [trigger.x, trigger.y])).toEqual([
      [7 * TILE, 7 * TILE - MAP_MARKER_FLOAT_LIFT_PX],
    ]);
  });

  it('grows each tile by the cull margin, scaled with the marker', () => {
    const [loot] = find(markers, 'floorLoot');
    expect(loot.bounds).toEqual({
      left: 5 * TILE - MAP_MARKER_CULL_MARGIN_PX,
      top: 5 * TILE - MAP_MARKER_CULL_MARGIN_PX,
      right: 6 * TILE + MAP_MARKER_CULL_MARGIN_PX,
      bottom: 6 * TILE + MAP_MARKER_CULL_MARGIN_PX,
    });

    const [bigLoot] = find(buildMarkerList(MAP, 32, STATUS), 'floorLoot');
    expect(bigLoot.bounds.left).toBe(5 * 32 - MAP_MARKER_CULL_MARGIN_PX * 2);
  });

  it('keeps the plate, its bob and the check badge inside the cull bounds', () => {
    const [fight] = find(markers, 'node');
    expect(fight.x).toBeGreaterThanOrEqual(fight.bounds.left);
    expect(fight.x + MAP_MARKER_PLATE_SIZE_PX).toBeLessThanOrEqual(fight.bounds.right);
    expect(fight.y - MAP_MARKER_BOB_PX - MAP_MARKER_CHECK.overhangPx).toBeGreaterThanOrEqual(fight.bounds.top);
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
    scale: 1,
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

  it('shows a marker whose reach straddles an edge', () => {
    expect(isMarkerInView(marker, { x: 1050, y: 1050 }, view)).toBe(true);
    expect(isMarkerInView(marker, { x: 700, y: 900 }, view)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMarkerBobOffset
// ---------------------------------------------------------------------------

describe('getMarkerBobOffset', () => {
  it('only ever moves by whole pixels within the bob range', () => {
    for (let step = 0; step < 64; step++) {
      const offset = getMarkerBobOffset((step / 64) * Math.PI * 2);
      expect(Number.isInteger(offset)).toBe(true);
      expect(Math.abs(offset)).toBeLessThanOrEqual(MAP_MARKER_BOB_PX);
    }
  });

  it('rests at 0 and peaks at the bob amplitude', () => {
    expect(getMarkerBobOffset(0)).toBe(0);
    expect(getMarkerBobOffset(Math.PI / 2)).toBe(MAP_MARKER_BOB_PX);
    expect(getMarkerBobOffset((Math.PI * 3) / 2)).toBe(-MAP_MARKER_BOB_PX);
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

// ---------------------------------------------------------------------------
// decodeTileGid
// ---------------------------------------------------------------------------

describe('decodeTileGid', () => {
  it('passes an unflagged gid through', () => {
    expect(decodeTileGid(131)).toEqual({ gid: 131, flipH: false, flipV: false, flipD: false });
  });

  it('reads each flag bit', () => {
    expect(decodeTileGid(2147484149)).toEqual({ gid: 501, flipH: true, flipV: false, flipD: false });
    expect(decodeTileGid(3221225512)).toEqual({ gid: 40, flipH: true, flipV: true, flipD: false });
    expect(decodeTileGid(3758096515)).toEqual({ gid: 131, flipH: true, flipV: true, flipD: true });
  });

  it('clears the hex-rotate bit Tiled keeps on orthogonal maps', () => {
    expect(decodeTileGid(0x10000000 + 7)).toEqual({ gid: 7, flipH: false, flipV: false, flipD: false });
  });
});

// ---------------------------------------------------------------------------
// getTileFlipMatrix
// ---------------------------------------------------------------------------

describe('getTileFlipMatrix', () => {
  const flips = (flipH: boolean, flipV: boolean, flipD: boolean): TileFlips => ({ flipH, flipV, flipD });

  /** Maps a point through the matrix, as the canvas would (y pointing down). */
  function apply([a, b, c, d]: [number, number, number, number], x: number, y: number): [number, number] {
    return [a * x + c * y, b * x + d * y];
  }

  it('is the identity without flags', () => {
    expect(getTileFlipMatrix(flips(false, false, false))).toEqual([1, 0, 0, 1]);
  });

  it('mirrors on each axis', () => {
    expect(apply(getTileFlipMatrix(flips(true, false, false)), 1, 0)).toEqual([-1, 0]);
    expect(apply(getTileFlipMatrix(flips(false, true, false)), 0, 1)).toEqual([0, -1]);
    expect(getTileFlipMatrix(flips(true, true, false))).toEqual([-1, 0, 0, -1]);
  });

  it('swaps the axes on the diagonal flip', () => {
    const diagonal = getTileFlipMatrix(flips(false, false, true));
    expect(apply(diagonal, 1, 0)).toEqual([0, 1]);
    expect(apply(diagonal, 0, 1)).toEqual([1, 0]);
  });

  it("rotates with Tiled's flag pairs", () => {
    // 90° clockwise (H + D): right becomes down.
    expect(apply(getTileFlipMatrix(flips(true, false, true)), 1, 0)).toEqual([0, 1]);
    // 270° clockwise (V + D): right becomes up.
    expect(apply(getTileFlipMatrix(flips(false, true, true)), 1, 0)).toEqual([0, -1]);
  });
});
