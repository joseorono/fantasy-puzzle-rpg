import type { Orb } from '~/types/battle';
import type { OrbType } from '~/types/rpg-elements';
import { getRandomElement } from '~/lib/utils';
import { ORB_TYPES, BOARD_ROWS, BOARD_COLS } from '~/constants/game';

/**
 * Generates a random orb type from the available ORB_TYPES.
 *
 * @returns A randomly selected OrbType
 */
export function getRandomOrbType(): OrbType {
  return getRandomElement(ORB_TYPES);
}

/**
 * Checks if there is a match (3 or more consecutive orbs of the same type)
 * at the specified position on the board.
 *
 * @param board - The game board containing orbs
 * @param row - The row index to check
 * @param col - The column index to check
 * @returns True if there's a match at the position, false otherwise
 */
export function hasMatchAtPosition(board: Orb[][], row: number, col: number): boolean {
  const orbType = board[row][col].type;
  const rows = board.length;
  const cols = board[0].length;

  // Check horizontal match (3 or more)
  let horizontalCount = 1;
  // Check left
  for (let c = col - 1; c >= 0 && board[row][c].type === orbType; c--) {
    horizontalCount++;
  }
  // Check right
  for (let c = col + 1; c < cols && board[row][c].type === orbType; c++) {
    horizontalCount++;
  }
  if (horizontalCount >= 3) return true;

  // Check vertical match (3 or more)
  let verticalCount = 1;
  // Check up
  for (let r = row - 1; r >= 0 && board[r][col].type === orbType; r--) {
    verticalCount++;
  }
  // Check down
  for (let r = row + 1; r < rows && board[r][col].type === orbType; r++) {
    verticalCount++;
  }
  if (verticalCount >= 3) return true;

  return false;
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
  from: { row: number; col: number },
  to: { row: number; col: number }
): Orb[][] {
  const newBoard = board.map(row => [...row]);

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
 * Checks if swapping two orbs would create a valid match.
 *
 * @param board - The game board containing orbs
 * @param from - The position of the first orb to swap
 * @param to - The position of the second orb to swap
 * @returns True if the swap would create a match, false otherwise
 */
export function isValidSwap(
  board: Orb[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
  const testBoard = swapOrbs(board, from, to);
  return hasMatchAtPosition(testBoard, from.row, from.col) ||
         hasMatchAtPosition(testBoard, to.row, to.col);
}

/**
 * Removes matched orbs from the board and applies gravity to fill empty spaces.
 * Matched orbs are removed, remaining orbs fall down, and new random orbs are
 * generated at the top.
 *
 * @param board - The game board containing orbs
 * @param matchedOrbIds - Set of orb IDs that should be removed
 * @returns A new board with matched orbs removed and refilled
 */
export function removeMatchedOrbsAndRefill(board: Orb[][], matchedOrbIds: Set<string>): Orb[][] {
  if (matchedOrbIds.size === 0) return board;

  const newBoard = board.map(row => [...row]);
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

    // Fill top with new random orbs
    for (let i = 0; i < newOrbsNeeded; i++) {
      const row = newOrbsNeeded - 1 - i;
      newBoard[row][col] = {
        id: `orb-${Date.now()}-${row}-${col}`,
        type: getRandomOrbType(),
        row,
        col,
      };
    }
  }

  return newBoard;
}
