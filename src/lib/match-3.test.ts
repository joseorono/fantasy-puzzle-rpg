import { describe, it, expect } from 'vitest';
import {
  findLineMatches,
  expandBombExplosions,
  isValidSwap,
  removeMatchedOrbsAndRefill,
  createBombOrb,
  orbsMatch,
} from './match-3';
import type { Orb } from '~/types/battle';
import type { OrbType } from '~/types/rpg-elements';

// ============================================================================
// Test helpers
// ============================================================================

/**
 * Build a board from a grid of cell tokens.
 * A token is an OrbType ('blue', 'green', ...) or '*' for a wildcard bomb.
 * Orb ids are deterministic ("row-col") so they survive swaps.
 */
function makeBoard(grid: string[][]): Orb[][] {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      const isBomb = cell === '*';
      const orb: Orb = {
        id: `${r}-${c}`,
        type: (isBomb ? 'gray' : cell) as OrbType,
        row: r,
        col: c,
      };
      if (isBomb) orb.isBomb = true;
      return orb;
    }),
  );
}

function countBombs(board: Orb[][]): number {
  return board.reduce((total, row) => total + row.filter((orb) => orb.isBomb).length, 0);
}

// ============================================================================
// orbsMatch
// ============================================================================

describe('orbsMatch', () => {
  const blue: Orb = { id: 'a', type: 'blue', row: 0, col: 0 };
  const blue2: Orb = { id: 'b', type: 'blue', row: 0, col: 1 };
  const green: Orb = { id: 'c', type: 'green', row: 0, col: 2 };
  const bomb: Orb = { id: 'd', type: 'gray', row: 0, col: 3, isBomb: true };

  it('matches orbs of the same color', () => {
    expect(orbsMatch(blue, blue2)).toBe(true);
  });

  it('does not match different colors', () => {
    expect(orbsMatch(blue, green)).toBe(false);
  });

  it('treats a bomb as a wildcard that matches anything', () => {
    expect(orbsMatch(bomb, green)).toBe(true);
    expect(orbsMatch(blue, bomb)).toBe(true);
  });
});

// ============================================================================
// findLineMatches
// ============================================================================

describe('findLineMatches', () => {
  it('finds a horizontal 3-match', () => {
    const board = makeBoard([['blue', 'blue', 'blue', 'green']]);
    const matched = findLineMatches(board);
    expect(matched).toEqual(new Set(['0-0', '0-1', '0-2']));
  });

  it('finds a vertical 3-match', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = findLineMatches(board);
    expect(matched).toEqual(new Set(['0-0', '1-0', '2-0']));
  });

  it('finds 4- and 5-matches', () => {
    const four = makeBoard([['green', 'green', 'green', 'green', 'blue']]);
    expect(findLineMatches(four).size).toBe(4);

    const five = makeBoard([['purple', 'purple', 'purple', 'purple', 'purple']]);
    expect(findLineMatches(five).size).toBe(5);
  });

  it('returns an empty set when there is no match', () => {
    const board = makeBoard([
      ['blue', 'green', 'blue'],
      ['green', 'blue', 'green'],
      ['blue', 'green', 'blue'],
    ]);
    expect(findLineMatches(board).size).toBe(0);
  });

  it('matches through a wildcard bomb [blue, *, blue]', () => {
    const board = makeBoard([['blue', '*', 'blue', 'green']]);
    const matched = findLineMatches(board);
    expect(matched).toEqual(new Set(['0-0', '0-1', '0-2']));
  });

  it('does NOT match a wildcard between two different colors [blue, *, green]', () => {
    const board = makeBoard([['blue', '*', 'green']]);
    expect(findLineMatches(board).size).toBe(0);
  });

  it('lets a bomb complete a vertical line', () => {
    const board = makeBoard([['yellow'], ['yellow'], ['*'], ['green']]);
    const matched = findLineMatches(board);
    expect(matched).toEqual(new Set(['0-0', '1-0', '2-0']));
  });
});

// ============================================================================
// expandBombExplosions
// ============================================================================

describe('expandBombExplosions', () => {
  it('leaves a non-bomb match untouched', () => {
    const board = makeBoard([['blue', 'blue', 'blue']]);
    const seed = new Set(['0-0', '0-1', '0-2']);
    const destroyed = expandBombExplosions(board, seed);
    expect(destroyed).toEqual(seed);
  });

  it('explodes the full 3x3 area around a matched center bomb', () => {
    const board = makeBoard([
      ['blue', 'green', 'blue'],
      ['green', '*', 'green'],
      ['blue', 'green', 'blue'],
    ]);
    const destroyed = expandBombExplosions(board, new Set(['1-1']));
    expect(destroyed.size).toBe(9); // center + 8 neighbors
  });

  it('clamps the blast at the board edge for a corner bomb', () => {
    const board = makeBoard([
      ['*', 'green', 'blue'],
      ['green', 'blue', 'green'],
      ['blue', 'green', 'blue'],
    ]);
    const destroyed = expandBombExplosions(board, new Set(['0-0']));
    // (0,0) + (0,1) + (1,0) + (1,1)
    expect(destroyed).toEqual(new Set(['0-0', '0-1', '1-0', '1-1']));
  });

  it('chains through a second bomb caught in the blast', () => {
    const board = makeBoard([
      ['*', 'green', 'blue'],
      ['green', '*', 'green'],
      ['blue', 'green', 'blue'],
    ]);
    // Seed only the corner bomb; its blast hits the center bomb, which chains.
    const destroyed = expandBombExplosions(board, new Set(['0-0']));
    expect(destroyed.size).toBe(9);
  });
});

// ============================================================================
// isValidSwap (wildcard-aware)
// ============================================================================

describe('isValidSwap', () => {
  it('returns true when a swap lines up three of a color', () => {
    const board = makeBoard([
      ['blue', 'blue', 'green'],
      ['yellow', 'purple', 'blue'],
    ]);
    // Swap (0,2)green with (1,2)blue -> row0 becomes blue,blue,blue
    expect(isValidSwap(board, { row: 0, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });

  it('returns false for a swap that creates no match', () => {
    const board = makeBoard([
      ['blue', 'green', 'purple'],
      ['yellow', 'purple', 'green'],
    ]);
    expect(isValidSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
  });

  it('returns true when swapping a bomb completes a line', () => {
    const board = makeBoard([
      ['blue', 'blue', 'green'],
      ['yellow', 'purple', '*'],
    ]);
    // Swap (0,2)green with (1,2)bomb -> row0 becomes blue, blue, * (wildcard match)
    expect(isValidSwap(board, { row: 0, col: 2 }, { row: 1, col: 2 })).toBe(true);
  });
});

// ============================================================================
// removeMatchedOrbsAndRefill
// ============================================================================

describe('removeMatchedOrbsAndRefill', () => {
  it('removes matched orbs and keeps the board full', () => {
    const board = makeBoard([
      ['blue', 'green'],
      ['blue', 'green'],
      ['blue', 'green'],
    ]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    const { board: result } = removeMatchedOrbsAndRefill(board, matched, 0, 0);

    // Same dimensions, no leftover matched ids
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(2);
    const allIds = result.flat().map((o) => o.id);
    expect(allIds.some((id) => matched.has(id))).toBe(false);
  });

  it('returns the same board and zero spawns when nothing is matched', () => {
    const board = makeBoard([['blue', 'green', 'purple']]);
    const result = removeMatchedOrbsAndRefill(board, new Set(), 1, 1);
    expect(result.board).toBe(board);
    expect(result.bombsSpawned).toBe(0);
  });

  it('spawns no bombs when bombsToSpawn=0 and chance=0', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 0, 0);
    expect(countBombs(result)).toBe(0);
    expect(bombsSpawned).toBe(0);
  });

  it('guarantees exactly bombsToSpawn bombs (random chance disabled)', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 new orbs spawned
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 2, 0);
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('turns every refilled orb into a bomb when chance=1', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 refilled slots
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 0, 1);
    expect(countBombs(result)).toBe(3);
    expect(bombsSpawned).toBe(3);
  });

  it('caps random bomb spawns at maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 refilled slots, chance=1
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 0, 1, 2);
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('clamps guaranteed bombs to maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    // Ask for 5 guaranteed bombs but cap at 2
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 5, 0, 2);
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('counts random and guaranteed bombs together against maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    // chance=1 would fill all 3, guaranteed adds more, but the cap holds at 2 total
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, 2, 1, 2);
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });
});

// ============================================================================
// createBombOrb
// ============================================================================

describe('createBombOrb', () => {
  it('creates a bomb orb at the given position', () => {
    const orb = createBombOrb(2, 3);
    expect(orb.isBomb).toBe(true);
    expect(orb.row).toBe(2);
    expect(orb.col).toBe(3);
  });
});
