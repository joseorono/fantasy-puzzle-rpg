import type { Orb, OrbSwap } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import { MIN_MATCH_LENGTH } from '~/constants/board';

// Read once: vite-node serves imported bindings through getters, which the hot loops below would pay per cell.
const RUN_LENGTH = MIN_MATCH_LENGTH;

/**
 * Determines whether two orbs can belong to the same match.
 * Bomb orbs are wildcards and match with any color.
 *
 * @param a - The first orb
 * @param b - The second orb
 * @returns True if the orbs are compatible for matching
 */
export function orbsMatch(a: Orb, b: Orb): boolean {
  return Boolean(a.isBomb) || Boolean(b.isBomb) || a.type === b.type;
}

// ============================================================================
// Greedy line scan (the source of truth for match membership)
// ============================================================================

/**
 * Scans a single line (row or column) and returns its runs of `MIN_MATCH_LENGTH` or more as
 * flat `[start, endExclusive, ...]` index pairs. Bomb orbs act as wildcards: a run's color is
 * set by its first non-bomb orb, and bombs extend any run.
 *
 * Uses a greedy left-to-right scan — the color is committed by the first non-bomb orb
 * encountered in a run, and a failed run restarts one cell later.
 *
 * Deliberately allocates: a fresh line copy and a fresh result array benchmark 3-4× faster
 * than walking the board by index math or reusing scratch arrays, which V8 deoptimizes.
 *
 * @param line - A 1D array of orbs (a board row or column)
 * @returns Flat array of `[start, end)` pairs, one per run
 */
function scanLineRuns(line: Orb[]): number[] {
  const runs: number[] = [];
  const n = line.length;

  let i = 0;
  while (i < n) {
    // The run color is undecided (null) until the first non-bomb orb is seen.
    let runColor: OrbType | null = line[i].isBomb ? null : line[i].type;
    let j = i + 1;

    while (j < n) {
      const orb = line[j];
      if (orb.isBomb) {
        j++;
        continue;
      }
      if (runColor === null) {
        runColor = orb.type;
        j++;
        continue;
      }
      if (orb.type === runColor) {
        j++;
        continue;
      }
      break;
    }

    if (j - i >= RUN_LENGTH) {
      runs.push(i, j);
      i = j;
    } else {
      i++;
    }
  }

  return runs;
}

function columnOf(board: Orb[][], col: number): Orb[] {
  const column: Orb[] = [];
  for (let row = 0; row < board.length; row++) column.push(board[row][col]);
  return column;
}

/**
 * Finds every orb that is part of a horizontal or vertical line match, with wildcard bomb
 * support. This is the single source of truth for line match detection.
 *
 * @param board - The game board containing orbs
 * @returns A set of orb IDs that are part of a line match
 */
export function findLineMatches(board: Orb[][]): Set<string> {
  const matchedIds = new Set<string>();
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    const runs = scanLineRuns(board[row]);
    for (let k = 0; k < runs.length; k += 2) {
      for (let col = runs[k]; col < runs[k + 1]; col++) matchedIds.add(board[row][col].id);
    }
  }

  for (let col = 0; col < cols; col++) {
    const runs = scanLineRuns(columnOf(board, col));
    for (let k = 0; k < runs.length; k += 2) {
      for (let row = runs[k]; row < runs[k + 1]; row++) matchedIds.add(board[row][col].id);
    }
  }

  return matchedIds;
}

/** Lengths of every greedy run on the board, rows first then columns. */
function lineRunLengths(board: Orb[][]): number[] {
  const lengths: number[] = [];
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    const runs = scanLineRuns(board[row]);
    for (let k = 0; k < runs.length; k += 2) lengths.push(runs[k + 1] - runs[k]);
  }
  for (let col = 0; col < cols; col++) {
    const runs = scanLineRuns(columnOf(board, col));
    for (let k = 0; k < runs.length; k += 2) lengths.push(runs[k + 1] - runs[k]);
  }

  return lengths;
}

/**
 * Counts the line matches (greedy runs) currently on the board. A cross-shaped match counts
 * as two runs, one per orientation.
 *
 * @param board - The game board containing orbs
 * @returns Number of runs across all rows and columns; 0 when the board is settled
 */
export function countLineRuns(board: Orb[][]): number {
  return lineRunLengths(board).length;
}

/**
 * Length of the longest line match currently on the board.
 *
 * @param board - The game board containing orbs
 * @returns The longest run length, or 0 when the board is settled
 */
export function longestLineRun(board: Orb[][]): number {
  return Math.max(0, ...lineRunLengths(board));
}

/**
 * Expands an initial set of matched orb IDs to include the orbs destroyed by
 * any matched bomb. Each matched bomb explodes its surrounding 3x3 area, and
 * any bomb caught in a blast chain-detonates.
 *
 * @param board - The game board containing orbs
 * @param matchedIds - IDs of orbs matched via lines (the explosion seeds)
 * @returns A set containing the line-matched IDs plus all orbs destroyed by explosions. When no
 *   matched orb is a bomb this is `matchedIds` itself (not a copy), so callers must not mutate it.
 */
export function expandBombExplosions(board: Orb[][], matchedIds: Set<string>): Set<string> {
  const rows = board.length;
  const cols = board[0].length;

  // Seed the queue with every matched bomb; without one there is nothing to expand.
  let queue: GridPosition[] | null = null;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const orb = board[row][col];
      if (orb.isBomb && matchedIds.has(orb.id)) (queue ??= []).push({ row, col });
    }
  }
  if (queue === null) return matchedIds;

  const destroyed = new Set<string>(matchedIds);

  while (queue.length > 0) {
    const { row, col } = queue.pop()!;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;

        const neighbor = board[r][c];
        if (destroyed.has(neighbor.id)) continue;

        destroyed.add(neighbor.id);
        // A bomb caught in the blast detonates as well.
        if (neighbor.isBomb) queue.push({ row: r, col: c });
      }
    }
  }

  return destroyed;
}

// ============================================================================
// Localized detection (allocation-free window checks)
// ============================================================================
// A "window" is MIN_MATCH_LENGTH consecutive cells in one orientation; it is "uniform" when its
// non-bomb cells share one color. A cell sits in a run exactly when one of the windows through
// it is uniform, and a swap creates a match exactly when a window through one of its endpoints
// is uniform afterwards. These checks read the board through an optional virtual swap so the
// move search never copies or mutates the board.

/** The orb at (row, col) as it would be after `swap`, without touching the board. */
function orbAt(board: Orb[][], row: number, col: number, swap: OrbSwap | null): Orb {
  if (swap !== null) {
    if (row === swap.from.row && col === swap.from.col) return board[swap.to.row][swap.to.col];
    if (row === swap.to.row && col === swap.to.col) return board[swap.from.row][swap.from.col];
  }
  return board[row][col];
}

/** True when the window starting at (row, col) along (dr, dc) is uniform. Caller ensures bounds. */
function isWindowUniform(
  board: Orb[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  swap: OrbSwap | null,
): boolean {
  let color: OrbType | null = null;
  for (let k = 0; k < RUN_LENGTH; k++) {
    const r = row + dr * k;
    const c = col + dc * k;
    const orb = swap === null ? board[r][c] : orbAt(board, r, c, swap);
    if (orb.isBomb) continue;
    if (color === null) {
      color = orb.type;
    } else if (orb.type !== color) {
      return false;
    }
  }
  return true;
}

/** True when any window containing (row, col), in either orientation, is uniform. */
function hasRunThrough(board: Orb[][], row: number, col: number, swap: OrbSwap | null): boolean {
  const rows = board.length;
  const cols = board[0].length;

  for (let start = col - (RUN_LENGTH - 1); start <= col; start++) {
    if (start < 0 || start + RUN_LENGTH > cols) continue;
    if (isWindowUniform(board, row, start, 0, 1, swap)) return true;
  }
  for (let start = row - (RUN_LENGTH - 1); start <= row; start++) {
    if (start < 0 || start + RUN_LENGTH > rows) continue;
    if (isWindowUniform(board, start, col, 1, 0, swap)) return true;
  }
  return false;
}

/**
 * Checks if the orb at the specified position is part of a line match (wildcard-aware),
 * reading only the windows through that cell — no board scan, no allocation.
 *
 * On a settled board this agrees with `findLineMatches` membership for every cell a swap can
 * touch. On a board that already contains a run it can be more permissive than the greedy
 * scan, which assigns a shared bomb to the leftmost run (`[blue, blue, *, green, green]` marks
 * cells 0-2 greedily, while this reports cell 3 as matched too). Use `findLineMatches` when
 * exact membership matters.
 *
 * @param board - The game board containing orbs
 * @param row - The row index to check
 * @param col - The column index to check
 * @returns True if a uniform window runs through the position
 */
export function hasMatchAtPosition(board: Orb[][], row: number, col: number): boolean {
  return hasRunThrough(board, row, col, null);
}

/**
 * Whether the board contains any line match at all. Equivalent to
 * `findLineMatches(board).size > 0` but scans windows with early exit and allocates nothing.
 *
 * @param board - The game board containing orbs
 * @returns True if at least one uniform window exists
 */
export function hasAnyLineMatch(board: Orb[][]): boolean {
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col + RUN_LENGTH <= cols; col++) {
      if (isWindowUniform(board, row, col, 0, 1, null)) return true;
    }
  }
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row + RUN_LENGTH <= rows; row++) {
      if (isWindowUniform(board, row, col, 1, 0, null)) return true;
    }
  }
  return false;
}

// ============================================================================
// Swaps and moves
// ============================================================================

/**
 * Swaps two orbs on the board and returns a new board. Only the touched rows are copied and
 * the two orbs are re-created with their new coordinates; the input board and its orbs are
 * never mutated.
 *
 * @param board - The game board containing orbs
 * @param from - The position of the first orb to swap
 * @param to - The position of the second orb to swap
 * @returns A new board with the orbs swapped
 */
export function swapOrbs(board: Orb[][], from: GridPosition, to: GridPosition): Orb[][] {
  const newBoard = [...board];
  newBoard[from.row] = [...board[from.row]];
  if (to.row !== from.row) newBoard[to.row] = [...board[to.row]];

  newBoard[from.row][from.col] = { ...board[to.row][to.col], row: from.row, col: from.col };
  newBoard[to.row][to.col] = { ...board[from.row][from.col], row: to.row, col: to.col };

  return newBoard;
}

/**
 * Checks if swapping two orbs would create a line match (wildcard-aware). The swap is applied
 * virtually: the board is neither copied nor mutated.
 *
 * @param board - The game board containing orbs
 * @param from - The position of the first orb to swap
 * @param to - The position of the second orb to swap
 * @returns True if the swap would create a match, false otherwise
 */
export function isValidSwap(board: Orb[][], from: GridPosition, to: GridPosition): boolean {
  const swap: OrbSwap = { from, to };
  return hasRunThrough(board, from.row, from.col, swap) || hasRunThrough(board, to.row, to.col, swap);
}

/** True when `orb` can sit in a run of `color` (`null` = the run is all bombs so far). */
function fitsColor(orb: Orb, color: OrbType | null): boolean {
  return orb.isBomb === true || color === null || orb.type === color;
}

/**
 * Finds a swap that completes the window starting at (row, col) along (dr, dc): one window cell
 * is exchanged with an adjacent cell outside the window whose orb agrees with the rest of the
 * window. Reads every cell directly; nothing is allocated until a move is found.
 */
function findMoveCompletingWindow(board: Orb[][], row: number, col: number, dr: number, dc: number): OrbSwap | null {
  const rows = board.length;
  const cols = board[0].length;

  for (let k = 0; k < RUN_LENGTH; k++) {
    // Color the other cells of the window agree on; skip the slot if they conflict.
    let color: OrbType | null = null;
    let conflict = false;
    for (let j = 0; j < RUN_LENGTH; j++) {
      if (j === k) continue;
      const orb = board[row + dr * j][col + dc * j];
      if (orb.isBomb) continue;
      if (color === null) {
        color = orb.type;
      } else if (orb.type !== color) {
        conflict = true;
        break;
      }
    }
    if (conflict) continue;

    const kr = row + dr * k;
    const kc = col + dc * k;
    // Neighbors outside the window: along the line only at its two ends, plus both sides.
    for (let n = 0; n < 4; n++) {
      let nr: number;
      let nc: number;
      if (n === 0) {
        if (k !== 0) continue;
        nr = kr - dr;
        nc = kc - dc;
      } else if (n === 1) {
        if (k !== RUN_LENGTH - 1) continue;
        nr = kr + dr;
        nc = kc + dc;
      } else {
        const side = n === 2 ? 1 : -1;
        nr = kr + dc * side;
        nc = kc + dr * side;
      }
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (fitsColor(board[nr][nc], color)) {
        return { from: { row: kr, col: kc }, to: { row: nr, col: nc } };
      }
    }
  }
  return null;
}

/**
 * Finds an adjacent swap that would create a line match on a settled board, scanning the
 * windows of every row and then every column. Any legal move completes some window by
 * swapping exactly one of its cells with a neighbor outside it, so enumerating windows finds
 * every move with a handful of direct reads each.
 *
 * Assumes no match is currently on the board (resolve matches first; see `isBoardPlayable`).
 *
 * @param board - The game board containing orbs
 * @returns A move, or null when the board has no possible move
 */
export function findPossibleMove(board: Orb[][]): OrbSwap | null {
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col + RUN_LENGTH <= cols; col++) {
      const move = findMoveCompletingWindow(board, row, col, 0, 1);
      if (move !== null) return move;
    }
  }
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row + RUN_LENGTH <= rows; row++) {
      const move = findMoveCompletingWindow(board, row, col, 1, 0);
      if (move !== null) return move;
    }
  }
  return null;
}

/**
 * Whether at least one adjacent swap on a settled board would create a line match.
 *
 * @param board - The game board containing orbs
 * @returns True if the player has a legal move
 */
export function hasPossibleMove(board: Orb[][]): boolean {
  return findPossibleMove(board) !== null;
}

/**
 * Whether the board can progress: either a match is pending (the cascade will act) or the
 * player has a legal move. A board that is neither is dead and must be repaired.
 *
 * @param board - The game board containing orbs
 * @returns True if the board has a pending match or a possible move
 */
export function isBoardPlayable(board: Orb[][]): boolean {
  return hasAnyLineMatch(board) || hasPossibleMove(board);
}
