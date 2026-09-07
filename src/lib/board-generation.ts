import type { Orb } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import {
  BOARD_ROWS,
  BOARD_COLS,
  ORB_TYPES,
  MIN_MATCH_LENGTH,
  BOMB_REFILL_CHANCE,
  OPENING_MAX_MATCHES,
  OPENING_MAX_RUN_LENGTH,
  MAX_BOARD_GENERATION_ATTEMPTS,
  MAX_SPAWN_REROLLS,
  MAX_RESHUFFLE_ATTEMPTS,
} from '~/constants/board';
import { countLineRuns, longestLineRun, hasAnyLineMatch, hasPossibleMove, isBoardPlayable } from './match-3';

// Read once: vite-node serves imported bindings through getters, which the placement loops would pay per cell.
const RUN_LENGTH = MIN_MATCH_LENGTH;

/** A `[0, 1)` random source. Gameplay always uses `Math.random`; tests and benches inject a seeded one. */
export type Rng = () => number;

// ============================================================================
// Orbs and ids
// ============================================================================

// Ids are unique for the whole session: the epoch protects the live board from a counter reset
// when this module is hot-reloaded, since the board component removes and animates orbs by id.
const SESSION_EPOCH = Date.now().toString(36);
let orbCounter = 0;

/**
 * Returns a fresh orb id, unique across every board of this session.
 *
 * @param isBomb - Whether the id is for a wildcard bomb (affects only the prefix)
 * @returns A new id such as `orb-m1x9k-42`
 */
export function nextOrbId(isBomb: boolean = false): string {
  orbCounter++;
  return `${isBomb ? 'bomb' : 'orb'}-${SESSION_EPOCH}-${orbCounter}`;
}

/**
 * Picks a uniformly random orb type from `ORB_TYPES`.
 *
 * @param rng - Random source (defaults to `Math.random`)
 * @returns A randomly selected OrbType
 */
export function getRandomOrbType(rng: Rng = Math.random): OrbType {
  return ORB_TYPES[Math.floor(rng() * ORB_TYPES.length)];
}

function createOrb(row: number, col: number, type: OrbType, isBomb: boolean = false): Orb {
  const orb: Orb = { id: nextOrbId(isBomb), type, row, col };
  if (isBomb) orb.isBomb = true;
  return orb;
}

/**
 * Creates a wildcard bomb orb at the given position.
 *
 * @param row - The row index for the orb
 * @param col - The column index for the orb
 * @param rng - Random source for the bomb's underlying color
 * @returns A new bomb Orb
 */
export function createBombOrb(row: number, col: number, rng: Rng = Math.random): Orb {
  return createOrb(row, col, getRandomOrbType(rng), true);
}

// ============================================================================
// Fills
// ============================================================================

/**
 * Fills a board with uniformly random orbs. May contain matches; may have no move.
 *
 * @param rows - Number of rows (defaults to BOARD_ROWS)
 * @param cols - Number of columns (defaults to BOARD_COLS)
 * @param rng - Random source (defaults to `Math.random`)
 * @returns A full board of fresh orbs
 */
export function fillBoardRandom(rows: number = BOARD_ROWS, cols: number = BOARD_COLS, rng: Rng = Math.random): Orb[][] {
  const board: Orb[][] = [];
  for (let row = 0; row < rows; row++) {
    const line: Orb[] = [];
    for (let col = 0; col < cols; col++) line.push(createOrb(row, col, getRandomOrbType(rng)));
    board.push(line);
  }
  return board;
}

/** A board under construction: unplaced cells are null and never complete a window. */
type PartialBoard = (Orb | null)[][];

/**
 * True when placing `type` at (row, col) would make some window through that cell uniform,
 * counting only cells already placed. Bombs are wildcards; null cells break every window.
 */
function wouldFormRun(cells: PartialBoard, row: number, col: number, type: OrbType): boolean {
  const rows = cells.length;
  const cols = cells[0].length;

  for (let orientation = 0; orientation < 2; orientation++) {
    const axis = orientation === 0 ? col : row;
    const limit = orientation === 0 ? cols : rows;

    for (let start = axis - (RUN_LENGTH - 1); start <= axis; start++) {
      if (start < 0 || start + RUN_LENGTH > limit) continue;

      let color: OrbType | null = null;
      let uniform = true;
      for (let k = 0; k < RUN_LENGTH; k++) {
        const r = orientation === 0 ? row : start + k;
        const c = orientation === 0 ? start + k : col;
        const cellType = r === row && c === col ? type : cells[r][c];
        if (cellType === null) {
          uniform = false;
          break;
        }
        const orbType = typeof cellType === 'string' ? cellType : cellType.isBomb ? null : cellType.type;
        if (orbType === null) continue;
        if (color === null) {
          color = orbType;
        } else if (orbType !== color) {
          uniform = false;
          break;
        }
      }
      if (uniform) return true;
    }
  }
  return false;
}

/**
 * Fills a board with random orbs so that no line match exists. Each cell draws uniformly from
 * the colors that do not complete a window with the cells placed before it (at most two of the
 * five are ever excluded), so one pass always succeeds.
 *
 * @param rows - Number of rows (defaults to BOARD_ROWS)
 * @param cols - Number of columns (defaults to BOARD_COLS)
 * @param rng - Random source (defaults to `Math.random`)
 * @returns A settled board (no matches); a move is not guaranteed
 */
export function fillBoardWithoutMatches(
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS,
  rng: Rng = Math.random,
): Orb[][] {
  const cells: PartialBoard = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  const allowed: OrbType[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      allowed.length = 0;
      for (const type of ORB_TYPES) {
        if (!wouldFormRun(cells, row, col, type)) allowed.push(type);
      }
      const type = allowed.length > 0 ? allowed[Math.floor(rng() * allowed.length)] : getRandomOrbType(rng);
      cells[row][col] = createOrb(row, col, type);
    }
  }

  return cells as Orb[][];
}

// ============================================================================
// Guarantees
// ============================================================================

/** Cells of the `XX?X` and `X?XX` seed patterns: three planted colors and one gap. */
const MOVE_SEED_PATTERNS: ReadonlyArray<{ planted: readonly number[]; gap: number }> = [
  { planted: [0, 1, 3], gap: 2 },
  { planted: [0, 2, 3], gap: 1 },
];

/**
 * Deterministically plants a guaranteed move on a board by rewriting up to four cells of one
 * row into `XX?X` or `X?XX` (colors chosen so no match forms), trying the edge rows first
 * because a middle row can be blocked from both sides. Windows containing bombs are skipped so
 * no bomb is overwritten. Every candidate is verified with the general predicates, so the
 * result is always settled with at least one move.
 *
 * @param board - A board with no possible move
 * @param rng - Random source; rotates which color and window are tried first
 * @returns A new board with a planted move, or null if no window could be planted
 */
export function plantMove(board: Orb[][], rng: Rng = Math.random): Orb[][] | null {
  const rows = board.length;
  const cols = board[0].length;
  const patternWidth = 4;
  if (cols < patternWidth) return null;

  const rowOrder = [0];
  if (rows > 1) rowOrder.push(rows - 1);
  for (let row = 1; row < rows - 1; row++) rowOrder.push(row);

  const colorOffset = Math.floor(rng() * ORB_TYPES.length);
  const startOffset = Math.floor(rng() * (cols - patternWidth + 1));

  for (const row of rowOrder) {
    for (let s = 0; s <= cols - patternWidth; s++) {
      const start = (startOffset + s) % (cols - patternWidth + 1);
      let hasBomb = false;
      for (let k = 0; k < patternWidth; k++) if (board[row][start + k].isBomb) hasBomb = true;
      if (hasBomb) continue;

      for (const pattern of MOVE_SEED_PATTERNS) {
        for (let xi = 0; xi < ORB_TYPES.length; xi++) {
          const x = ORB_TYPES[(colorOffset + xi) % ORB_TYPES.length];
          for (const y of ORB_TYPES) {
            if (y === x) continue;

            const candidate = [...board];
            const line = [...board[row]];
            for (const offset of pattern.planted) line[start + offset] = { ...line[start + offset], type: x };
            line[start + pattern.gap] = { ...line[start + pattern.gap], type: y };
            candidate[row] = line;

            if (!hasAnyLineMatch(candidate) && hasPossibleMove(candidate)) return candidate;
          }
        }
      }
    }
  }
  return null;
}

/**
 * Deals an opening board. The deal is rejection-sampled from the natural random distribution,
 * so openings stay as random as an unconstrained fill: a deal is accepted when it has at most
 * `OPENING_MAX_MATCHES` pre-made runs, none longer than `OPENING_MAX_RUN_LENGTH`, and is
 * playable (a run or a move). If no deal qualifies within `maxAttempts`, falls back to a
 * settled fill with a planted move.
 *
 * @param rows - Number of rows (defaults to BOARD_ROWS)
 * @param cols - Number of columns (defaults to BOARD_COLS)
 * @param rng - Random source (defaults to `Math.random`)
 * @param maxAttempts - Random deals to try before the settled fallback
 * @returns A playable opening board
 */
export function createOpeningBoard(
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS,
  rng: Rng = Math.random,
  maxAttempts: number = MAX_BOARD_GENERATION_ATTEMPTS,
): Orb[][] {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = fillBoardRandom(rows, cols, rng);
    const runs = countLineRuns(board);
    if (runs > OPENING_MAX_MATCHES) continue;
    if (runs > 0) {
      if (longestLineRun(board) <= OPENING_MAX_RUN_LENGTH) return board;
      continue;
    }
    if (hasPossibleMove(board)) return board;
  }

  const settled = fillBoardWithoutMatches(rows, cols, rng);
  if (hasPossibleMove(settled)) return settled;
  return plantMove(settled, rng) ?? settled;
}

/** Fisher-Yates shuffle in place. */
function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
  return items;
}

/**
 * Lays the shuffled color bag into the non-bomb cells row-major, taking at each cell the first
 * remaining color that does not complete a window; a tail dead-end takes the next color anyway.
 */
function placeColorBag(board: Orb[][], bag: OrbType[], rng: Rng): Orb[][] {
  const cells: PartialBoard = board.map((row) => row.map((orb) => (orb.isBomb ? orb : null)));
  const shuffled = shuffleInPlace([...bag], rng);
  let cursor = 0;

  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] !== null) continue;

      let pick = cursor;
      for (let i = cursor; i < shuffled.length; i++) {
        if (!wouldFormRun(cells, row, col, shuffled[i])) {
          pick = i;
          break;
        }
      }
      const type = shuffled[pick];
      shuffled[pick] = shuffled[cursor];
      shuffled[cursor] = type;
      cursor++;

      cells[row][col] = createOrb(row, col, type);
    }
  }

  return cells as Orb[][];
}

/**
 * Redistributes a dead board into a playable one without changing what the player owns: the
 * multiset of colors is preserved exactly, every bomb keeps its id and cell, and only the
 * non-bomb orbs move (with fresh ids, so they animate back in). A settled layout with a move
 * is preferred so a deadlock is not rewarded with a free cascade; a layout with a run is
 * accepted only when `maxAttempts` permutations could not avoid one. Only if every permutation
 * was dead (vanishingly rare) are up to four orbs re-colored to plant a move.
 *
 * @param board - The board to reshuffle
 * @param rng - Random source (defaults to `Math.random`)
 * @param maxAttempts - Permutations to try for a settled layout
 * @returns A playable board with the same colors and bombs
 */
export function reshuffleBoard(
  board: Orb[][],
  rng: Rng = Math.random,
  maxAttempts: number = MAX_RESHUFFLE_ATTEMPTS,
): Orb[][] {
  const bag: OrbType[] = [];
  for (const row of board) for (const orb of row) if (!orb.isBomb) bag.push(orb.type);
  if (bag.length === 0) return board;

  let withRun: Orb[][] | null = null;
  let last: Orb[][] | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = placeColorBag(board, bag, rng);
    last = candidate;
    if (!hasAnyLineMatch(candidate)) {
      if (hasPossibleMove(candidate)) return candidate;
      continue;
    }
    withRun ??= candidate;
  }

  if (withRun !== null) return withRun;
  const fallback = last ?? placeColorBag(board, bag, rng);
  if (isBoardPlayable(fallback)) return fallback;
  return plantMove(fallback, rng) ?? fallback;
}

/**
 * Guarantees a board can progress after a refill. Returns the same reference when the board
 * already has a pending match or a legal move. Otherwise re-draws the colors of the freshly
 * spawned non-bomb orbs (ids kept — the player has not seen them yet) up to `maxRerolls`
 * times, and finally reshuffles the whole board.
 *
 * @param board - The refilled board
 * @param spawned - Positions of the orbs spawned by this refill
 * @param rng - Random source (defaults to `Math.random`)
 * @param maxRerolls - Re-draws to try before reshuffling
 * @returns The playable board and whether a full reshuffle was needed
 */
export function ensurePlayableBoard(
  board: Orb[][],
  spawned: GridPosition[],
  rng: Rng = Math.random,
  maxRerolls: number = MAX_SPAWN_REROLLS,
): { board: Orb[][]; wasReshuffled: boolean } {
  if (isBoardPlayable(board)) return { board, wasReshuffled: false };

  const rerollable = spawned.filter(({ row, col }) => !board[row][col].isBomb);
  if (rerollable.length > 0) {
    const touchedRows = new Set(rerollable.map(({ row }) => row));
    for (let attempt = 0; attempt < maxRerolls; attempt++) {
      const next = [...board];
      for (const row of touchedRows) next[row] = [...board[row]];
      for (const { row, col } of rerollable) next[row][col] = { ...board[row][col], type: getRandomOrbType(rng) };
      if (isBoardPlayable(next)) return { board: next, wasReshuffled: false };
    }
  }

  return { board: reshuffleBoard(board, rng), wasReshuffled: true };
}

// ============================================================================
// Refill
// ============================================================================

export interface RefillOptions {
  /** How many of the newly spawned orbs are guaranteed to become bombs (default 0). */
  bombsToSpawn?: number;
  /** Per-orb probability (0-1) that a refilled orb spawns as a bomb (default BOMB_REFILL_CHANCE). */
  bombRefillChance?: number;
  /** Hard cap on total bombs spawned this call, random + guaranteed (default Infinity). */
  maxBombs?: number;
  /** Random source (defaults to `Math.random`). */
  rng?: Rng;
}

export interface RefillResult {
  board: Orb[][];
  bombsSpawned: number;
  /** True when the refilled board was dead and had to be fully reshuffled. */
  wasReshuffled: boolean;
}

/**
 * Removes matched orbs from the board and applies gravity to fill empty spaces.
 * Matched orbs are removed, remaining orbs fall down, and new random orbs are
 * generated at the top. Newly spawned orbs may become wildcard bombs in two ways:
 * a guaranteed `bombsToSpawn` count, plus an independent per-orb random chance.
 * The result is always playable (see {@link ensurePlayableBoard}); refills never
 * avoid creating matches, so cascades are untouched.
 *
 * @param board - The game board containing orbs
 * @param matchedOrbIds - Set of orb IDs that should be removed
 * @param options - Bomb knobs and random source
 * @returns The new board, how many bombs were created, and whether a reshuffle was needed
 */
export function removeMatchedOrbsAndRefill(
  board: Orb[][],
  matchedOrbIds: Set<string>,
  options: RefillOptions = {},
): RefillResult {
  const { bombsToSpawn = 0, bombRefillChance = BOMB_REFILL_CHANCE, maxBombs = Infinity, rng = Math.random } = options;
  if (matchedOrbIds.size === 0) return { board, bombsSpawned: 0, wasReshuffled: false };

  const newBoard = board.map((row) => [...row]);
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  // Track freshly spawned orbs so some can be promoted to bombs afterwards
  const newlySpawned: GridPosition[] = [];
  // Total bombs created this call (random + guaranteed), clamped to maxBombs.
  let bombsSpawned = 0;

  for (let col = 0; col < cols; col++) {
    // Collect surviving orbs from bottom to top
    const remainingOrbs: Orb[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      const orb = board[row][col];
      if (!matchedOrbIds.has(orb.id)) remainingOrbs.push(orb);
    }

    const newOrbsNeeded = rows - remainingOrbs.length;

    // Fill from bottom with the survivors
    for (let i = 0; i < remainingOrbs.length; i++) {
      const row = rows - 1 - i;
      newBoard[row][col] = { ...remainingOrbs[i], row, col };
    }

    // Fill top with new random orbs; each has an independent chance to be a bomb,
    // until the per-call bomb cap is reached.
    for (let i = 0; i < newOrbsNeeded; i++) {
      const row = newOrbsNeeded - 1 - i;
      const isBomb = bombsSpawned < maxBombs && rng() < bombRefillChance;
      if (isBomb) bombsSpawned++;
      newBoard[row][col] = createOrb(row, col, getRandomOrbType(rng), isBomb);
      newlySpawned.push({ row, col });
    }
  }

  // Guarantee `bombsToSpawn` bombs by promoting freshly spawned orbs that the
  // random roll above didn't already turn into bombs — but never exceed maxBombs.
  const nonBombSpawns = newlySpawned.filter(({ row, col }) => !newBoard[row][col].isBomb);
  const guaranteedBudget = Math.max(0, maxBombs - bombsSpawned);
  const bombCount = Math.min(Math.max(0, Math.floor(bombsToSpawn)), nonBombSpawns.length, guaranteedBudget);
  for (let i = 0; i < bombCount; i++) {
    // Partial Fisher-Yates: pick a not-yet-chosen position into slot i.
    const pick = i + Math.floor(rng() * (nonBombSpawns.length - i));
    const swap = nonBombSpawns[i];
    nonBombSpawns[i] = nonBombSpawns[pick];
    nonBombSpawns[pick] = swap;

    const { row, col } = nonBombSpawns[i];
    newBoard[row][col] = { ...newBoard[row][col], isBomb: true };
  }
  bombsSpawned += bombCount;

  const ensured = ensurePlayableBoard(newBoard, newlySpawned, rng);
  return { board: ensured.board, bombsSpawned, wasReshuffled: ensured.wasReshuffled };
}
