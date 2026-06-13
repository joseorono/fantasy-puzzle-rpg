import type { Orb } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import { getRandomElement } from '~/lib/utils';
import { ORB_TYPES, BOARD_ROWS, BOARD_COLS, BOMB_REFILL_CHANCE } from '~/constants/game';

/**
 * Generates a random orb type from the available ORB_TYPES.
 *
 * @returns A randomly selected OrbType
 */
export function getRandomOrbType(): OrbType {
  return getRandomElement(ORB_TYPES);
}

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

/**
 * Scans a single line (row or column) of orbs and returns the indices that
 * belong to a run of 3 or more matching orbs. Bomb orbs act as wildcards: a
 * run's color is set by its first non-bomb orb, and bombs extend any run.
 *
 * Uses a greedy left-to-right scan — the color is committed by the first
 * non-bomb orb encountered in a run.
 *
 * @param line - A 1D array of orbs (a board row or column)
 * @returns Array of indices within the line that are part of a 3+ run
 */
function scanLineForMatches(line: Orb[]): number[] {
  const matchedIndices: number[] = [];
  const n = line.length;

  let i = 0;
  while (i < n) {
    // The run color is undecided (null) until the first non-bomb orb is seen.
    let runColor: OrbType | null = line[i].isBomb ? null : line[i].type;
    let j = i + 1;

    while (j < n) {
      const orb = line[j];
      if (orb.isBomb) {
        // Wildcard always extends the run without changing its color.
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

    const runLength = j - i;
    if (runLength >= 3) {
      for (let k = i; k < j; k++) matchedIndices.push(k);
      i = j;
    } else {
      i++;
    }
  }

  return matchedIndices;
}

/**
 * Finds every orb that is part of a horizontal or vertical line match (3+),
 * with wildcard bomb support. This is the single source of truth for line
 * match detection.
 *
 * @param board - The game board containing orbs
 * @returns A set of orb IDs that are part of a line match
 */
export function findLineMatches(board: Orb[][]): Set<string> {
  const matchedIds = new Set<string>();
  const rows = board.length;
  const cols = board[0].length;

  // Horizontal lines
  for (let row = 0; row < rows; row++) {
    for (const col of scanLineForMatches(board[row])) {
      matchedIds.add(board[row][col].id);
    }
  }

  // Vertical lines
  for (let col = 0; col < cols; col++) {
    const column: Orb[] = [];
    for (let row = 0; row < rows; row++) column.push(board[row][col]);
    for (const row of scanLineForMatches(column)) {
      matchedIds.add(board[row][col].id);
    }
  }

  return matchedIds;
}

/**
 * Expands an initial set of matched orb IDs to include the orbs destroyed by
 * any matched bomb. Each matched bomb explodes its surrounding 3x3 area, and
 * any bomb caught in a blast chain-detonates.
 *
 * @param board - The game board containing orbs
 * @param matchedIds - IDs of orbs matched via lines (the explosion seeds)
 * @returns A set containing the line-matched IDs plus all orbs destroyed by explosions
 */
export function expandBombExplosions(board: Orb[][], matchedIds: Set<string>): Set<string> {
  const rows = board.length;
  const cols = board[0].length;

  const destroyed = new Set<string>(matchedIds);
  const queue: GridPosition[] = [];

  // Seed the queue with every matched bomb.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const orb = board[row][col];
      if (orb.isBomb && destroyed.has(orb.id)) {
        queue.push({ row, col });
      }
    }
  }

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

/**
 * Creates a wildcard bomb orb at the given position.
 *
 * @param row - The row index for the orb
 * @param col - The column index for the orb
 * @returns A new bomb Orb
 */
export function createBombOrb(row: number, col: number): Orb {
  return {
    id: `bomb-${Date.now()}-${row}-${col}`,
    type: getRandomOrbType(),
    row,
    col,
    isBomb: true,
  };
}

/**
 * Checks if there is a line match (3 or more, wildcard-aware) at the specified
 * position on the board.
 *
 * @param board - The game board containing orbs
 * @param row - The row index to check
 * @param col - The column index to check
 * @returns True if the orb at the position is part of a line match
 */
export function hasMatchAtPosition(board: Orb[][], row: number, col: number): boolean {
  return findLineMatches(board).has(board[row][col].id);
}

/**
 * Creates an initial game board with randomly generated orbs.
 *
 * @param rows - Number of rows in the board (defaults to BOARD_ROWS)
 * @param cols - Number of columns in the board (defaults to BOARD_COLS)
 * @returns A 2D array representing the game board with orbs
 */
export function createInitialBoard(rows: number = BOARD_ROWS, cols: number = BOARD_COLS): Orb[][] {
  const board: Orb[][] = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = {
        id: `orb-${row}-${col}`,
        type: getRandomOrbType(),
        row,
        col,
      };
    }
  }
  return board;
}

/**
 * Swaps two orbs on the board and updates their positions.
 *
 * @param board - The game board containing orbs
 * @param from - The position of the first orb to swap
 * @param to - The position of the second orb to swap
 * @returns A new board with the orbs swapped
 */
export function swapOrbs(
  board: Orb[][],
  from: GridPosition,
  to: GridPosition,
): Orb[][] {
  const newBoard = board.map((row) => [...row]);

  // Swap orbs
  const temp = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = newBoard[to.row][to.col];
  newBoard[to.row][to.col] = temp;

  // Update positions
  newBoard[from.row][from.col].row = from.row;
  newBoard[from.row][from.col].col = from.col;
  newBoard[to.row][to.col].row = to.row;
  newBoard[to.row][to.col].col = to.col;

  return newBoard;
}

/**
 * Checks if swapping two orbs would create a valid match (wildcard-aware).
 *
 * @param board - The game board containing orbs
 * @param from - The position of the first orb to swap
 * @param to - The position of the second orb to swap
 * @returns True if the swap would create a match, false otherwise
 */
export function isValidSwap(
  board: Orb[][],
  from: GridPosition,
  to: GridPosition,
): boolean {
  const testBoard = swapOrbs(board, from, to);
  const matched = findLineMatches(testBoard);
  return (
    matched.has(testBoard[from.row][from.col].id) || matched.has(testBoard[to.row][to.col].id)
  );
}

/**
 * Removes matched orbs from the board and applies gravity to fill empty spaces.
 * Matched orbs are removed, remaining orbs fall down, and new random orbs are
 * generated at the top. Newly spawned orbs may become wildcard bombs in two ways:
 * a guaranteed `bombsToSpawn` count, plus an independent per-orb random chance.
 *
 * @param board - The game board containing orbs
 * @param matchedOrbIds - Set of orb IDs that should be removed
 * @param bombsToSpawn - How many of the newly spawned orbs are guaranteed to become bombs (default 0)
 * @param bombRefillChance - Per-orb probability (0-1) that a refilled orb spawns as a bomb (default BOMB_REFILL_CHANCE)
 * @returns A new board with matched orbs removed and refilled
 */
export function removeMatchedOrbsAndRefill(
  board: Orb[][],
  matchedOrbIds: Set<string>,
  bombsToSpawn: number = 0,
  bombRefillChance: number = BOMB_REFILL_CHANCE,
): Orb[][] {
  if (matchedOrbIds.size === 0) return board;

  const newBoard = board.map((row) => [...row]);
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  // Mark matched orbs for removal
  const matchedPositions = new Set<string>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (matchedOrbIds.has(newBoard[row][col].id)) {
        matchedPositions.add(`${row}-${col}`);
      }
    }
  }

  // Track freshly spawned orbs so some can be promoted to bombs afterwards
  const newlySpawned: GridPosition[] = [];

  // Process each column for gravity
  for (let col = 0; col < cols; col++) {
    // Collect non-matched orbs from bottom to top
    const remainingOrbs: Orb[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      if (!matchedPositions.has(`${row}-${col}`)) {
        remainingOrbs.push(newBoard[row][col]);
      }
    }

    // Calculate how many new orbs we need
    const newOrbsNeeded = rows - remainingOrbs.length;

    // Fill from bottom with remaining orbs
    for (let i = 0; i < remainingOrbs.length; i++) {
      const row = rows - 1 - i;
      newBoard[row][col] = {
        ...remainingOrbs[i],
        row,
        col,
      };
    }

    // Fill top with new random orbs; each has an independent chance to be a bomb.
    for (let i = 0; i < newOrbsNeeded; i++) {
      const row = newOrbsNeeded - 1 - i;
      const isBomb = Math.random() < bombRefillChance;
      newBoard[row][col] = {
        id: `${isBomb ? 'bomb' : 'orb'}-${Date.now()}-${row}-${col}`,
        type: getRandomOrbType(),
        row,
        col,
        ...(isBomb ? { isBomb: true } : {}),
      };
      newlySpawned.push({ row, col });
    }
  }

  // Guarantee `bombsToSpawn` bombs by promoting freshly spawned orbs that the
  // random roll above didn't already turn into bombs.
  const nonBombSpawns = newlySpawned.filter(({ row, col }) => !newBoard[row][col].isBomb);
  const bombCount = Math.min(Math.max(0, Math.floor(bombsToSpawn)), nonBombSpawns.length);
  for (let i = 0; i < bombCount; i++) {
    // Partial Fisher-Yates: pick a not-yet-chosen position into slot i.
    const pick = i + Math.floor(Math.random() * (nonBombSpawns.length - i));
    const swap = nonBombSpawns[i];
    nonBombSpawns[i] = nonBombSpawns[pick];
    nonBombSpawns[pick] = swap;

    const { row, col } = nonBombSpawns[i];
    newBoard[row][col] = { ...newBoard[row][col], isBomb: true };
  }

  return newBoard;
}
