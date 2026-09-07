import { describe, it, expect } from 'vitest';
import {
  nextOrbId,
  getRandomOrbType,
  createBombOrb,
  fillBoardRandom,
  fillBoardWithoutMatches,
  plantMove,
  createOpeningBoard,
  reshuffleBoard,
  ensurePlayableBoard,
  removeMatchedOrbsAndRefill,
} from './board-generation';
import {
  findLineMatches,
  hasAnyLineMatch,
  hasPossibleMove,
  isBoardPlayable,
  countLineRuns,
  longestLineRun,
} from './match-3';
import {
  makeBoard,
  countBombs,
  colorMultiset,
  withCell,
  bruteForceFindMove,
  DEADLOCKED_GRID,
  DEADLOCKED_CORNER_BOMB_GRID,
  EARLY_MOVE_GRID,
  LATE_MOVE_GRID,
  MATCH_GRID,
  type CellToken,
} from './match-3.fixtures';
import { createSeededRandom } from './math';
import {
  BOARD_ROWS,
  BOARD_COLS,
  ORB_TYPES,
  OPENING_MAX_MATCHES,
  OPENING_MAX_RUN_LENGTH,
  MAX_SPAWN_REROLLS,
} from '~/constants/board';
import type { Orb } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';

// ============================================================================
// Test helpers
// ============================================================================

const SEEDS = 500;
const RESHUFFLE_SEEDS = 200;

function allIds(board: Orb[][]): string[] {
  return board.flat().map((orb) => orb.id);
}

function expectDimensions(board: Orb[][], rows = BOARD_ROWS, cols = BOARD_COLS) {
  expect(board).toHaveLength(rows);
  for (let r = 0; r < rows; r++) {
    expect(board[r]).toHaveLength(cols);
    for (let c = 0; c < cols; c++) expect(board[r][c]).toMatchObject({ row: r, col: c });
  }
}

/** Dead grid with three bombs that share no row or column, so a settled reshuffle is possible. */
const DEADLOCKED_THREE_BOMB_GRID: CellToken[][] = withCell(
  withCell(withCell(DEADLOCKED_GRID, 1, 1, '*'), 4, 4, '*'),
  7,
  2,
  '*',
);

/**
 * Ten dead boards: the `(r + 2c + k) % 5` and `(2r + c + k) % 5` colorings for every shift `k`.
 * Both families keep equal colors at least three apart in every line (a genuinely dead random
 * board is too rare to sample). Each one is brute-force confirmed dead before use.
 */
function deadBoards(): Orb[][][] {
  const boards: Orb[][][] = [];
  for (let k = 0; k < ORB_TYPES.length; k++) {
    for (const weights of [
      [1, 2],
      [2, 1],
    ]) {
      const grid: CellToken[][] = Array.from({ length: BOARD_ROWS }, (_, r) =>
        Array.from(
          { length: BOARD_COLS },
          (_, c) => ORB_TYPES[(weights[0] * r + weights[1] * c + k) % ORB_TYPES.length],
        ),
      );
      const board = makeBoard(grid);
      expect(findLineMatches(board).size).toBe(0);
      expect(bruteForceFindMove(board)).toBeNull();
      boards.push(board);
    }
  }
  return boards;
}

// ============================================================================
// nextOrbId / getRandomOrbType / createBombOrb
// ============================================================================

describe('nextOrbId', () => {
  it('is unique across many calls and prefixed by kind', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(nextOrbId(i % 2 === 0));
    expect(ids.size).toBe(1000);
    expect(nextOrbId()).toMatch(/^orb-/);
    expect(nextOrbId(true)).toMatch(/^bomb-/);
  });
});

describe('getRandomOrbType', () => {
  it('is deterministic under a seeded rng and covers every type roughly uniformly', () => {
    const a = createSeededRandom(5);
    const b = createSeededRandom(5);
    for (let i = 0; i < 50; i++) expect(getRandomOrbType(a)).toBe(getRandomOrbType(b));

    const rng = createSeededRandom(6);
    const counts = new Map<string, number>();
    const draws = 5000;
    for (let i = 0; i < draws; i++) {
      const type = getRandomOrbType(rng);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    expect(counts.size).toBe(ORB_TYPES.length);
    const expected = draws / ORB_TYPES.length;
    for (const type of ORB_TYPES) {
      expect(counts.get(type)!).toBeGreaterThan(expected * 0.8);
      expect(counts.get(type)!).toBeLessThan(expected * 1.2);
    }
  });
});

describe('createBombOrb', () => {
  it('creates a bomb orb at the given position', () => {
    const orb = createBombOrb(2, 3);
    expect(orb.isBomb).toBe(true);
    expect(orb.row).toBe(2);
    expect(orb.col).toBe(3);
    expect(orb.id).toMatch(/^bomb-/);
  });
});

// ============================================================================
// Fills
// ============================================================================

describe('fillBoardRandom', () => {
  it('fills the default dimensions with unique, bomb-free orbs', () => {
    const board = fillBoardRandom(BOARD_ROWS, BOARD_COLS, createSeededRandom(1));
    expectDimensions(board);
    expect(new Set(allIds(board)).size).toBe(BOARD_ROWS * BOARD_COLS);
    expect(countBombs(board)).toBe(0);
  });
});

describe('fillBoardWithoutMatches', () => {
  it('never produces a line match over many seeds', () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const board = fillBoardWithoutMatches(BOARD_ROWS, BOARD_COLS, createSeededRandom(seed));
      expect(hasAnyLineMatch(board)).toBe(false);
      expect(findLineMatches(board).size).toBe(0);
    }
  });

  it('has the right shape, unique ids and no bombs', () => {
    const board = fillBoardWithoutMatches(BOARD_ROWS, BOARD_COLS, createSeededRandom(3));
    expectDimensions(board);
    expect(new Set(allIds(board)).size).toBe(BOARD_ROWS * BOARD_COLS);
    expect(countBombs(board)).toBe(0);
  });
});

// ============================================================================
// plantMove
// ============================================================================

describe('plantMove', () => {
  it('turns a dead board into a settled board with a move by touching one row', () => {
    for (const board of deadBoards()) {
      const planted = plantMove(board, createSeededRandom(1));
      expect(planted).not.toBeNull();
      expect(hasAnyLineMatch(planted!)).toBe(false);
      expect(hasPossibleMove(planted!)).toBe(true);

      let changedRows = 0;
      let changedCells = 0;
      for (let r = 0; r < BOARD_ROWS; r++) {
        let rowChanged = 0;
        for (let c = 0; c < BOARD_COLS; c++) {
          if (planted![r][c].type !== board[r][c].type) rowChanged++;
        }
        if (rowChanged > 0) changedRows++;
        changedCells += rowChanged;
      }
      expect(changedRows).toBe(1);
      expect(changedCells).toBeLessThanOrEqual(4);
    }
  });

  it('never overwrites a bomb and leaves the input untouched', () => {
    const board = makeBoard(DEADLOCKED_CORNER_BOMB_GRID);
    const before = board.map((row) => row.map((orb) => ({ ...orb })));
    const planted = plantMove(board, createSeededRandom(2));
    expect(board).toEqual(before);
    expect(planted).not.toBeNull();
    expect(planted![0][0].isBomb).toBe(true);
    expect(isBoardPlayable(planted!)).toBe(true);
  });

  it('varies the planted window with the seed', () => {
    const board = makeBoard(DEADLOCKED_GRID);
    const signatures = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const planted = plantMove(board, createSeededRandom(seed))!;
      signatures.add(planted.map((row) => row.map((orb) => orb.type).join(',')).join('|'));
    }
    expect(signatures.size).toBeGreaterThan(1);
  });
});

// ============================================================================
// createOpeningBoard
// ============================================================================

describe('createOpeningBoard', () => {
  it('always deals a playable board within the opening caps', () => {
    let zeroRuns = 0;
    let cappedRuns = 0;
    const colorCounts = new Map<string, number>();

    for (let seed = 0; seed < SEEDS; seed++) {
      const board = createOpeningBoard(BOARD_ROWS, BOARD_COLS, createSeededRandom(seed));
      expectDimensions(board);
      const runs = countLineRuns(board);
      expect(runs).toBeLessThanOrEqual(OPENING_MAX_MATCHES);
      expect(longestLineRun(board)).toBeLessThanOrEqual(OPENING_MAX_RUN_LENGTH);
      expect(isBoardPlayable(board)).toBe(true);
      expect(countBombs(board)).toBe(0);
      if (runs === 0) zeroRuns++;
      if (runs === OPENING_MAX_MATCHES) cappedRuns++;
      for (const orb of board.flat()) colorCounts.set(orb.type, (colorCounts.get(orb.type) ?? 0) + 1);
    }

    // The cap truncates the natural distribution rather than fixing the run count.
    expect(zeroRuns).toBeGreaterThan(0);
    expect(cappedRuns).toBeGreaterThan(0);

    // Colors stay uniform: the guarantee never skews what the player is dealt.
    const expected = (SEEDS * BOARD_ROWS * BOARD_COLS) / ORB_TYPES.length;
    for (const type of ORB_TYPES) {
      expect(colorCounts.get(type)!).toBeGreaterThan(expected * 0.9);
      expect(colorCounts.get(type)!).toBeLessThan(expected * 1.1);
    }
  });

  it('falls back to a settled board with a move when no random deal is allowed', () => {
    for (let seed = 0; seed < 50; seed++) {
      const board = createOpeningBoard(BOARD_ROWS, BOARD_COLS, createSeededRandom(seed), 0);
      expect(hasAnyLineMatch(board)).toBe(false);
      expect(hasPossibleMove(board)).toBe(true);
    }
  });

  it('uses the board constants by default', () => {
    expectDimensions(createOpeningBoard());
  });
});

// ============================================================================
// reshuffleBoard
// ============================================================================

describe('reshuffleBoard', () => {
  const inputs: Array<{ name: string; board: Orb[][] }> = [
    { name: 'dead', board: makeBoard(DEADLOCKED_GRID) },
    { name: 'dead with corner bomb', board: makeBoard(DEADLOCKED_CORNER_BOMB_GRID) },
    { name: 'dead with three isolated bombs', board: makeBoard(DEADLOCKED_THREE_BOMB_GRID) },
  ];

  for (const { name, board } of inputs) {
    it(`keeps colors and bombs, renews moved ids, and lands playable (${name})`, () => {
      let settled = 0;
      const inputIds = new Set(allIds(board));

      for (let seed = 0; seed < RESHUFFLE_SEEDS; seed++) {
        const result = reshuffleBoard(board, createSeededRandom(seed));
        expectDimensions(result);
        expect(colorMultiset(result)).toEqual(colorMultiset(board));
        expect(isBoardPlayable(result)).toBe(true);
        if (!hasAnyLineMatch(result)) settled++;

        for (let r = 0; r < BOARD_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) {
            const source = board[r][c];
            const orb = result[r][c];
            if (source.isBomb) {
              expect(orb).toBe(source);
            } else {
              expect(orb.isBomb).toBeUndefined();
              expect(inputIds.has(orb.id)).toBe(false);
            }
          }
        }
      }

      expect(settled).toBeGreaterThanOrEqual(RESHUFFLE_SEEDS * 0.9);
    });
  }

  it('still returns a playable board when no permutation attempt is allowed', () => {
    for (const { board } of inputs) {
      for (let seed = 0; seed < 20; seed++) {
        const result = reshuffleBoard(board, createSeededRandom(seed), 0);
        expect(isBoardPlayable(result)).toBe(true);
        expect(colorMultiset(result)).toEqual(colorMultiset(board));
        expect(countBombs(result)).toBe(countBombs(board));
      }
    }
  });

  it('returns the board unchanged when it has no non-bomb orbs', () => {
    const board = makeBoard([
      ['*', '*'],
      ['*', '*'],
    ]);
    expect(reshuffleBoard(board, createSeededRandom(1))).toBe(board);
  });
});

// ============================================================================
// ensurePlayableBoard
// ============================================================================

describe('ensurePlayableBoard', () => {
  const topRow: GridPosition[] = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ];

  it('returns the same reference for a board with a move or a pending match', () => {
    for (const grid of [EARLY_MOVE_GRID, MATCH_GRID]) {
      const board = makeBoard(grid);
      expect(ensurePlayableBoard(board, topRow, createSeededRandom(1))).toEqual({ board, wasReshuffled: false });
      expect(ensurePlayableBoard(board, topRow, createSeededRandom(1)).board).toBe(board);
    }
  });

  it('repairs a dead board by re-drawing only the spawned orbs when it can', () => {
    const board = makeBoard(DEADLOCKED_GRID);
    let rerolled = 0;
    let rerolledIntoRun = 0;

    for (let seed = 0; seed < 100; seed++) {
      const result = ensurePlayableBoard(board, topRow, createSeededRandom(seed));
      expect(isBoardPlayable(result.board)).toBe(true);
      if (result.wasReshuffled) continue;

      rerolled++;
      if (hasAnyLineMatch(result.board)) rerolledIntoRun++;
      for (let r = 1; r < BOARD_ROWS; r++) expect(result.board[r]).toBe(board[r]);
      for (let c = 0; c < BOARD_COLS; c++) {
        expect(result.board[0][c].id).toBe(board[0][c].id);
        if (c >= topRow.length) expect(result.board[0][c]).toBe(board[0][c]);
      }
    }

    expect(rerolled).toBeGreaterThan(0);
    // Cascades are never suppressed: a re-draw that lands a run is accepted as-is.
    expect(rerolledIntoRun).toBeGreaterThan(0);
  });

  it('never re-types a spawned bomb', () => {
    const board = makeBoard(DEADLOCKED_CORNER_BOMB_GRID);
    for (let seed = 0; seed < 50; seed++) {
      const result = ensurePlayableBoard(board, topRow, createSeededRandom(seed), MAX_SPAWN_REROLLS);
      expect(result.board[0][0]).toBe(board[0][0]);
    }
  });

  it('falls back to a reshuffle that keeps colors and bombs when rerolls are exhausted', () => {
    const board = makeBoard(DEADLOCKED_CORNER_BOMB_GRID);
    const result = ensurePlayableBoard(board, topRow, createSeededRandom(1), 0);
    expect(result.wasReshuffled).toBe(true);
    expect(isBoardPlayable(result.board)).toBe(true);
    expect(colorMultiset(result.board)).toEqual(colorMultiset(board));
    expect(result.board[0][0]).toBe(board[0][0]);
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
    const { board: result } = removeMatchedOrbsAndRefill(board, matched, { bombRefillChance: 0 });

    // Same dimensions, no leftover matched ids
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(2);
    const ids = allIds(result);
    expect(ids.some((id) => matched.has(id))).toBe(false);
    expect(ids).toContain('0-1');
  });

  it('returns the same board and zero spawns when nothing is matched', () => {
    const board = makeBoard([['blue', 'green', 'purple']]);
    const result = removeMatchedOrbsAndRefill(board, new Set(), { bombsToSpawn: 1, bombRefillChance: 1 });
    expect(result.board).toBe(board);
    expect(result.bombsSpawned).toBe(0);
    expect(result.wasReshuffled).toBe(false);
  });

  it('spawns no bombs when bombsToSpawn=0 and chance=0', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, { bombRefillChance: 0 });
    expect(countBombs(result)).toBe(0);
    expect(bombsSpawned).toBe(0);
  });

  it('guarantees exactly bombsToSpawn bombs (random chance disabled)', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 new orbs spawned
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, {
      bombsToSpawn: 2,
      bombRefillChance: 0,
    });
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('turns every refilled orb into a bomb when chance=1', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 refilled slots
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, { bombRefillChance: 1 });
    expect(countBombs(result)).toBe(3);
    expect(bombsSpawned).toBe(3);
  });

  it('caps random bomb spawns at maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']); // 3 refilled slots, chance=1
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, {
      bombRefillChance: 1,
      maxBombs: 2,
    });
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('clamps guaranteed bombs to maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    // Ask for 5 guaranteed bombs but cap at 2
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, {
      bombsToSpawn: 5,
      bombRefillChance: 0,
      maxBombs: 2,
    });
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('counts random and guaranteed bombs together against maxBombs', () => {
    const board = makeBoard([['blue'], ['blue'], ['blue'], ['green']]);
    const matched = new Set(['0-0', '1-0', '2-0']);
    // chance=1 would fill all 3, guaranteed adds more, but the cap holds at 2 total
    const { board: result, bombsSpawned } = removeMatchedOrbsAndRefill(board, matched, {
      bombsToSpawn: 2,
      bombRefillChance: 1,
      maxBombs: 2,
    });
    expect(countBombs(result)).toBe(2);
    expect(bombsSpawned).toBe(2);
  });

  it('is deterministic under a seeded rng and preserves surviving ids', () => {
    const board = makeBoard(LATE_MOVE_GRID);
    const matched = new Set(['0-0', '0-1', '0-2']);
    const a = removeMatchedOrbsAndRefill(board, matched, { rng: createSeededRandom(8) });
    const b = removeMatchedOrbsAndRefill(board, matched, { rng: createSeededRandom(8) });
    expect(a.board.map((row) => row.map((orb) => orb.type))).toEqual(b.board.map((row) => row.map((orb) => orb.type)));

    const survivors = allIds(board).filter((id) => !matched.has(id));
    const resultIds = new Set(allIds(a.board));
    for (const id of survivors) expect(resultIds.has(id)).toBe(true);
  });

  it('always returns a playable board, even from a dead one', () => {
    const board = makeBoard(DEADLOCKED_GRID);
    const matched = new Set(['0-0', '0-1', '0-2']);
    for (let seed = 0; seed < 100; seed++) {
      const result = removeMatchedOrbsAndRefill(board, matched, { bombRefillChance: 0, rng: createSeededRandom(seed) });
      expect(isBoardPlayable(result.board)).toBe(true);
    }
  });

  it('is exactly the raw random draw whenever the board stays playable (cascades untouched)', () => {
    // LATE_MOVE keeps its row-7 move after row 0 is cleared, so the guarantee's fast path must
    // return the refill untouched: every spawned type equals the raw draw from the same seed.
    const board = makeBoard(LATE_MOVE_GRID);
    const matched = new Set(['0-0', '0-1', '0-2']);
    let refillsWithRun = 0;

    for (let seed = 0; seed < 300; seed++) {
      const result = removeMatchedOrbsAndRefill(board, matched, { rng: createSeededRandom(seed) });
      expect(result.wasReshuffled).toBe(false);

      const raw = createSeededRandom(seed);
      for (let col = 0; col < 3; col++) {
        raw(); // the per-orb bomb roll
        expect(result.board[0][col].type).toBe(ORB_TYPES[Math.floor(raw() * ORB_TYPES.length)]);
      }
      if (hasAnyLineMatch(result.board)) refillsWithRun++;
    }

    expect(refillsWithRun).toBeGreaterThan(0);
  });
});
