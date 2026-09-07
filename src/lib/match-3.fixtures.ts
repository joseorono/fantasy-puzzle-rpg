/**
 * Deterministic boards and reference implementations shared by the match-3 tests and benches.
 * Pure module: no vitest imports, so benches and tests can both load it.
 *
 * Grids are literal 8×6 boards by nature; everything else reads `~/constants/board`.
 */

import type { Orb } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import type { OrbSwap } from '~/types/battle';
import { BOARD_COLS, BOARD_ROWS, ORB_TYPES } from '~/constants/board';
import { findLineMatches } from './match-3';

/** Cell token: an OrbType, or `'*'` for a wildcard bomb. */
export type CellToken = OrbType | '*';

/**
 * Build a board from a grid of cell tokens.
 * Orb ids are deterministic ("row-col") so they survive swaps.
 */
export function makeBoard(grid: CellToken[][]): Orb[][] {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      const isBomb = cell === '*';
      const orb: Orb = {
        id: `${r}-${c}`,
        type: isBomb ? 'gray' : cell,
        row: r,
        col: c,
      };
      if (isBomb) orb.isBomb = true;
      return orb;
    }),
  );
}

export function countBombs(board: Orb[][]): number {
  return board.reduce((total, row) => total + row.filter((orb) => orb.isBomb).length, 0);
}

/** Sorted multiset of every non-bomb color on the board. */
export function colorMultiset(board: Orb[][]): OrbType[] {
  return board
    .flat()
    .filter((orb) => !orb.isBomb)
    .map((orb) => orb.type)
    .sort();
}

/** Returns a copy of `grid` with one cell replaced. */
export function withCell(grid: CellToken[][], row: number, col: number, token: CellToken): CellToken[][] {
  return grid.map((r, ri) => (ri === row ? r.map((cell, ci) => (ci === col ? token : cell)) : [...r]));
}

/** Returns a copy of `grid` with one whole row replaced. */
export function withRow(grid: CellToken[][], row: number, cells: CellToken[]): CellToken[][] {
  return grid.map((r, ri) => (ri === row ? [...cells] : [...r]));
}

// ─── Named 8×6 grids ─────────────────────────────────────────────────────────

/**
 * Dead board: `color(r, c) = ORB_TYPES[(r + 2c) % 5]`. Equal colors sit at least five cells
 * apart in every row (+2, +4 mod 5) and column (+1, +2 mod 5), so no window is uniform and no
 * adjacent swap can make one. The tests brute-force confirm this rather than trust the math.
 */
export const DEADLOCKED_GRID: CellToken[][] = Array.from({ length: BOARD_ROWS }, (_, r) =>
  Array.from({ length: BOARD_COLS }, (_, c) => ORB_TYPES[(r + 2 * c) % ORB_TYPES.length]),
);

/** Dead board with a wildcard in the corner. Still dead (brute-force verified in tests). */
export const DEADLOCKED_CORNER_BOMB_GRID: CellToken[][] = withCell(DEADLOCKED_GRID, 0, 0, '*');

/** Settled board whose only move, (0,2)↔(0,3), is found by the very first window scanned (best case). */
export const EARLY_MOVE_GRID: CellToken[][] = withRow(DEADLOCKED_GRID, 0, [
  'blue',
  'blue',
  'gray',
  'blue',
  'yellow',
  'blue',
]);

/** Settled board whose only move, (7,2)↔(7,3), sits in the last row, late in the horizontal pass. */
export const LATE_MOVE_GRID: CellToken[][] = withRow(DEADLOCKED_GRID, 7, [
  'purple',
  'purple',
  'green',
  'purple',
  'blue',
  'purple',
]);

/** `EARLY_MOVE_GRID` with the gap filled: row 0 opens with a 4-run of blue. */
export const MATCH_GRID: CellToken[][] = withCell(EARLY_MOVE_GRID, 0, 2, 'blue');

export const EARLY_MOVE: OrbSwap = { from: { row: 0, col: 2 }, to: { row: 0, col: 3 } };
export const LATE_MOVE: OrbSwap = { from: { row: 7, col: 2 }, to: { row: 7, col: 3 } };

// ─── Random boards for property tests ────────────────────────────────────────

/** Uniform random board with "row-col" ids, independent of the generation code under test. */
export function makeRandomBoard(rng: () => number, rows = BOARD_ROWS, cols = BOARD_COLS): Orb[][] {
  const grid: CellToken[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellToken[] = [];
    for (let c = 0; c < cols; c++) row.push(ORB_TYPES[Math.floor(rng() * ORB_TYPES.length)]);
    grid.push(row);
  }
  return makeBoard(grid);
}

/** Returns a copy of `board` with `count` random cells turned into bombs. */
export function sprinkleBombs(board: Orb[][], count: number, rng: () => number): Orb[][] {
  const next = board.map((row) => row.map((orb) => ({ ...orb })));
  const rows = next.length;
  const cols = next[0].length;
  let placed = 0;
  while (placed < count) {
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (next[r][c].isBomb) continue;
    next[r][c].isBomb = true;
    placed++;
  }
  return next;
}

// ─── Reference implementations (the original algorithms, kept for agreement tests) ──

/** Copy-swap that never touches the input orbs. */
export function copySwap(board: Orb[][], from: GridPosition, to: GridPosition): Orb[][] {
  const next = board.map((row) => [...row]);
  next[from.row][from.col] = { ...board[to.row][to.col], row: from.row, col: from.col };
  next[to.row][to.col] = { ...board[from.row][from.col], row: to.row, col: to.col };
  return next;
}

/** The original `isValidSwap`: swap on a copy, full-board scan, endpoint membership. */
export function bruteForceIsValidSwap(board: Orb[][], from: GridPosition, to: GridPosition): boolean {
  const swapped = copySwap(board, from, to);
  const matched = findLineMatches(swapped);
  return matched.has(swapped[from.row][from.col].id) || matched.has(swapped[to.row][to.col].id);
}

/** Every adjacent pair on the board, horizontal pairs row-major first, then vertical. */
export function adjacentPairs(rows: number, cols: number): OrbSwap[] {
  const pairs: OrbSwap[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) pairs.push({ from: { row: r, col: c }, to: { row: r, col: c + 1 } });
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) pairs.push({ from: { row: r, col: c }, to: { row: r + 1, col: c } });
  }
  return pairs;
}

/** Exhaustive move search built only on the reference swap check. */
export function bruteForceFindMove(board: Orb[][]): OrbSwap | null {
  for (const pair of adjacentPairs(board.length, board[0].length)) {
    if (bruteForceIsValidSwap(board, pair.from, pair.to)) return pair;
  }
  return null;
}
