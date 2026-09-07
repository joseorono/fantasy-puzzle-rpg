import { describe, it, expect } from 'vitest';
import {
  orbsMatch,
  findLineMatches,
  countLineRuns,
  longestLineRun,
  expandBombExplosions,
  hasMatchAtPosition,
  hasAnyLineMatch,
  swapOrbs,
  isValidSwap,
  findPossibleMove,
  hasPossibleMove,
  isBoardPlayable,
} from './match-3';
import {
  makeBoard,
  makeRandomBoard,
  sprinkleBombs,
  copySwap,
  adjacentPairs,
  bruteForceIsValidSwap,
  bruteForceFindMove,
  DEADLOCKED_GRID,
  DEADLOCKED_CORNER_BOMB_GRID,
  EARLY_MOVE_GRID,
  LATE_MOVE_GRID,
  MATCH_GRID,
  EARLY_MOVE,
  LATE_MOVE,
} from './match-3.fixtures';
import { createSeededRandom } from './math';
import { BOARD_ROWS, BOARD_COLS } from '~/constants/board';
import type { Orb } from '~/types/battle';

// ============================================================================
// Test helpers
// ============================================================================

const PROPERTY_SAMPLES = 300;

/** Random boards with no line match (filtered by the greedy reference), optionally with bombs. */
function settledRandomBoards(count: number, bombs: number, seed: number): Orb[][][] {
  const rng = createSeededRandom(seed);
  const boards: Orb[][][] = [];
  while (boards.length < count) {
    let board = makeRandomBoard(rng);
    if (bombs > 0) board = sprinkleBombs(board, bombs, rng);
    if (findLineMatches(board).size === 0) boards.push(board);
  }
  return boards;
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

  it('finds a run that lives only in the last column', () => {
    const board = makeBoard([
      ['blue', 'green', 'purple'],
      ['green', 'blue', 'purple'],
      ['blue', 'green', 'purple'],
      ['green', 'blue', 'yellow'],
    ]);
    expect(findLineMatches(board)).toEqual(new Set(['0-2', '1-2', '2-2']));
  });
});

describe('countLineRuns / longestLineRun', () => {
  it('report zero on a settled board', () => {
    const board = makeBoard(DEADLOCKED_GRID);
    expect(countLineRuns(board)).toBe(0);
    expect(longestLineRun(board)).toBe(0);
  });

  it('count one run and its length for a single 4-run', () => {
    const board = makeBoard(MATCH_GRID);
    expect(countLineRuns(board)).toBe(1);
    expect(longestLineRun(board)).toBe(4);
  });

  it('count a cross-shaped match as two runs', () => {
    const board = makeBoard([
      ['green', 'blue', 'green'],
      ['blue', 'blue', 'blue'],
      ['green', 'blue', 'green'],
    ]);
    expect(countLineRuns(board)).toBe(2);
    expect(longestLineRun(board)).toBe(3);
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

  it('returns the input set itself when no matched orb is a bomb, and a new set otherwise', () => {
    const plain = makeBoard([['blue', 'blue', 'blue', '*']]);
    const seed = new Set(['0-0', '0-1', '0-2']);
    expect(expandBombExplosions(plain, seed)).toBe(seed);

    const withBomb = makeBoard([['blue', 'blue', '*', 'green']]);
    const bombSeed = new Set(['0-0', '0-1', '0-2']);
    const destroyed = expandBombExplosions(withBomb, bombSeed);
    expect(destroyed).not.toBe(bombSeed);
    expect(destroyed).toEqual(new Set(['0-0', '0-1', '0-2', '0-3']));
    expect(bombSeed.size).toBe(3);
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
// hasMatchAtPosition (localized window check)
// ============================================================================

describe('hasMatchAtPosition', () => {
  it('detects a horizontal and a vertical run through the cell', () => {
    const horizontal = makeBoard([['green', 'blue', 'blue', 'blue', 'green']]);
    expect(hasMatchAtPosition(horizontal, 0, 2)).toBe(true);
    expect(hasMatchAtPosition(horizontal, 0, 0)).toBe(false);

    const vertical = makeBoard([['green'], ['blue'], ['blue'], ['blue'], ['green']]);
    expect(hasMatchAtPosition(vertical, 3, 0)).toBe(true);
    expect(hasMatchAtPosition(vertical, 4, 0)).toBe(false);
  });

  it('matches through a bomb in the middle [blue, *, blue]', () => {
    const board = makeBoard([['blue', '*', 'blue', 'green']]);
    expect(hasMatchAtPosition(board, 0, 0)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 1)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 3)).toBe(false);
  });

  it('matches a bomb at the line end [*, *, blue]', () => {
    const board = makeBoard([['*', '*', 'blue', 'green']]);
    expect(hasMatchAtPosition(board, 0, 0)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 2)).toBe(true);
  });

  it('treats adjacent bombs as part of any run [blue, *, *, green]', () => {
    const board = makeBoard([['blue', '*', '*', 'green']]);
    expect(hasMatchAtPosition(board, 0, 1)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 2)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 0)).toBe(true);
    expect(hasMatchAtPosition(board, 0, 3)).toBe(true);
  });

  it('does not match a wildcard between two different colors [blue, *, green]', () => {
    const board = makeBoard([['blue', '*', 'green']]);
    expect(hasMatchAtPosition(board, 0, 1)).toBe(false);
  });

  it('matches an all-bomb line of three but not of two', () => {
    expect(hasMatchAtPosition(makeBoard([['*', '*', '*']]), 0, 1)).toBe(true);
    expect(hasMatchAtPosition(makeBoard([['*', '*', 'blue', 'green']]), 0, 3)).toBe(false);
    expect(hasMatchAtPosition(makeBoard([['*', '*']]), 0, 0)).toBe(false);
  });

  it('is more permissive than the greedy scan only on an already-matched board', () => {
    // Greedy assigns the shared bomb to the leftmost run and marks cells 0-2 only.
    const board = makeBoard([['blue', 'blue', '*', 'green', 'green']]);
    expect(findLineMatches(board)).toEqual(new Set(['0-0', '0-1', '0-2']));
    expect(hasMatchAtPosition(board, 0, 3)).toBe(true);
  });

  it('agrees with greedy membership for every cell of a settled board after any swap', () => {
    for (const bombs of [0, 3]) {
      for (const board of settledRandomBoards(PROPERTY_SAMPLES, bombs, 11 + bombs)) {
        for (const { from, to } of adjacentPairs(BOARD_ROWS, BOARD_COLS)) {
          const swapped = copySwap(board, from, to);
          const greedy = findLineMatches(swapped);
          expect(hasMatchAtPosition(swapped, from.row, from.col)).toBe(greedy.has(swapped[from.row][from.col].id));
          expect(hasMatchAtPosition(swapped, to.row, to.col)).toBe(greedy.has(swapped[to.row][to.col].id));
        }
      }
    }
  });
});

// ============================================================================
// hasAnyLineMatch
// ============================================================================

describe('hasAnyLineMatch', () => {
  it('agrees with findLineMatches on the named fixtures', () => {
    for (const grid of [DEADLOCKED_GRID, DEADLOCKED_CORNER_BOMB_GRID, EARLY_MOVE_GRID, LATE_MOVE_GRID, MATCH_GRID]) {
      const board = makeBoard(grid);
      expect(hasAnyLineMatch(board)).toBe(findLineMatches(board).size > 0);
    }
  });

  it('agrees with findLineMatches on random boards with and without bombs', () => {
    for (const bombs of [0, 3]) {
      const rng = createSeededRandom(21 + bombs);
      for (let i = 0; i < PROPERTY_SAMPLES; i++) {
        let board = makeRandomBoard(rng);
        if (bombs > 0) board = sprinkleBombs(board, bombs, rng);
        expect(hasAnyLineMatch(board)).toBe(findLineMatches(board).size > 0);
      }
    }
  });

  it('handles lines shorter than a match', () => {
    expect(hasAnyLineMatch(makeBoard([['blue', 'blue']]))).toBe(false);
  });
});

// ============================================================================
// swapOrbs
// ============================================================================

describe('swapOrbs', () => {
  it('never mutates the input board or its orbs', () => {
    const board = makeBoard(EARLY_MOVE_GRID);
    const before = board.map((row) => row.map((orb) => ({ ...orb })));

    swapOrbs(board, EARLY_MOVE.from, EARLY_MOVE.to);

    expect(board).toEqual(before);
  });

  it('gives the swapped orbs their new coordinates and shares untouched rows', () => {
    const board = makeBoard(EARLY_MOVE_GRID);
    const swapped = swapOrbs(board, { row: 0, col: 2 }, { row: 1, col: 2 });

    expect(swapped[0][2]).toMatchObject({ id: '1-2', row: 0, col: 2 });
    expect(swapped[1][2]).toMatchObject({ id: '0-2', row: 1, col: 2 });
    expect(swapped[0]).not.toBe(board[0]);
    expect(swapped[1]).not.toBe(board[1]);
    expect(swapped[2]).toBe(board[2]);
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

  it('does not touch the board', () => {
    const board = makeBoard(LATE_MOVE_GRID);
    const before = board.map((row) => row.map((orb) => ({ ...orb })));
    isValidSwap(board, LATE_MOVE.from, LATE_MOVE.to);
    expect(board).toEqual(before);
  });

  it('agrees with the copy-swap reference on every pair of settled boards, with and without bombs', () => {
    for (const bombs of [0, 3]) {
      for (const board of settledRandomBoards(PROPERTY_SAMPLES, bombs, 31 + bombs)) {
        for (const { from, to } of adjacentPairs(BOARD_ROWS, BOARD_COLS)) {
          expect(isValidSwap(board, from, to)).toBe(bruteForceIsValidSwap(board, from, to));
        }
      }
    }
  });
});

// ============================================================================
// findPossibleMove / hasPossibleMove / isBoardPlayable
// ============================================================================

describe('findPossibleMove', () => {
  it('returns null on the dead fixtures (brute-force confirmed)', () => {
    for (const grid of [DEADLOCKED_GRID, DEADLOCKED_CORNER_BOMB_GRID]) {
      const board = makeBoard(grid);
      expect(findLineMatches(board).size).toBe(0);
      expect(bruteForceFindMove(board)).toBeNull();
      expect(findPossibleMove(board)).toBeNull();
      expect(hasPossibleMove(board)).toBe(false);
    }
  });

  it('finds the early move and the late move', () => {
    expect(findPossibleMove(makeBoard(EARLY_MOVE_GRID))).toEqual(EARLY_MOVE);
    expect(findPossibleMove(makeBoard(LATE_MOVE_GRID))).toEqual(LATE_MOVE);
  });

  it('finds a move exactly when the brute-force search does, on settled random boards', () => {
    for (const bombs of [0, 3]) {
      for (const board of settledRandomBoards(PROPERTY_SAMPLES, bombs, 41 + bombs)) {
        const found = findPossibleMove(board);
        expect(found === null).toBe(bruteForceFindMove(board) === null);
        if (found) {
          const distance = Math.abs(found.from.row - found.to.row) + Math.abs(found.from.col - found.to.col);
          expect(distance).toBe(1);
          expect(isValidSwap(board, found.from, found.to)).toBe(true);
        }
      }
    }
  });
});

describe('isBoardPlayable', () => {
  it('is true with a pending match, true with a move, false when dead', () => {
    expect(isBoardPlayable(makeBoard(MATCH_GRID))).toBe(true);
    expect(isBoardPlayable(makeBoard(EARLY_MOVE_GRID))).toBe(true);
    expect(isBoardPlayable(makeBoard(DEADLOCKED_GRID))).toBe(false);
    expect(isBoardPlayable(makeBoard(DEADLOCKED_CORNER_BOMB_GRID))).toBe(false);
  });
});
