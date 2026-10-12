import { describe, expect, it } from 'vitest';
import { canPlayerOccupy, floodOpenTiles, getUnbeatenGateTiles } from './map-gates';
import type { WalkableMask } from './tilemap-collision';
import type { InteractiveMapNode } from '~/types/map-node';

/** `.` = walkable, `#` = blocked. */
function maskFrom(rows: string[]): WalkableMask {
  const width = rows[0].length;
  const data = new Uint8Array(width * rows.length);
  rows.forEach((line, row) => [...line].forEach((cell, col) => (data[row * width + col] = cell === '.' ? 1 : 0)));
  return { data, width, height: rows.length };
}

// A 2-wide corridor running down; the gate fills row 2.
const CORRIDOR = maskFrom(['..', '..', '..', '..', '..']);
const GATE = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
];

function makeNode(id: string, blocksMovement: boolean, position: InteractiveMapNode['position']): InteractiveMapNode {
  return { id, type: 'Battle', position, name: id, blocksMovement };
}

describe('getUnbeatenGateTiles', () => {
  const nodes = [
    makeNode('gate', true, GATE),
    makeNode('beaten', true, { row: 4, col: 0 }),
    makeNode('open', false, { row: 0, col: 0 }),
  ];

  it('lists every tile of every unbeaten blocking node, and nothing else', () => {
    expect(getUnbeatenGateTiles(nodes, (node) => node.id === 'beaten')).toEqual(GATE);
  });

  it('is empty once every gate is beaten', () => {
    expect(getUnbeatenGateTiles(nodes, () => true)).toEqual([]);
  });
});

describe('floodOpenTiles', () => {
  const open = floodOpenTiles(CORRIDOR, GATE, [{ row: 0, col: 0 }]);
  const isOpen = (row: number, col: number) => open[row * CORRIDOR.width + col] === 1;

  it('opens the origin side and seals the far side', () => {
    expect(isOpen(1, 1)).toBe(true);
    expect(isOpen(3, 0)).toBe(false);
    expect(isOpen(4, 1)).toBe(false);
  });

  it('never marks a gate tile open', () => {
    expect(isOpen(2, 0)).toBe(false);
    expect(isOpen(2, 1)).toBe(false);
  });

  it('opens a second origin on the far side too, so arriving there never strands the player', () => {
    const both = floodOpenTiles(CORRIDOR, GATE, [
      { row: 0, col: 0 },
      { row: 4, col: 0 },
    ]);
    expect(both[3 * CORRIDOR.width]).toBe(1);
  });

  it('skips an origin standing on the gate itself', () => {
    const fromGate = floodOpenTiles(CORRIDOR, GATE, [
      { row: 0, col: 0 },
      { row: 2, col: 0 },
    ]);
    expect(fromGate[3 * CORRIDOR.width]).toBe(0);
  });
});

describe('canPlayerOccupy', () => {
  const open = floodOpenTiles(CORRIDOR, GATE, [{ row: 0, col: 0 }]);

  it('lets the player step onto the gate but not past it', () => {
    expect(canPlayerOccupy(CORRIDOR, open, false, 1, 0)).toBe(true);
    expect(canPlayerOccupy(CORRIDOR, open, true, 2, 0)).toBe(true);
    expect(canPlayerOccupy(CORRIDOR, open, false, 3, 0)).toBe(false);
  });

  it('only checks the ground when no gate is unbeaten', () => {
    expect(canPlayerOccupy(CORRIDOR, null, false, 4, 1)).toBe(true);
    expect(canPlayerOccupy(CORRIDOR, null, false, 9, 9)).toBe(false);
  });
});
