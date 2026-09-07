import { bench, describe } from 'vitest';
import {
  findLineMatches,
  hasMatchAtPosition,
  hasAnyLineMatch,
  countLineRuns,
  isValidSwap,
  swapOrbs,
  findPossibleMove,
  isBoardPlayable,
} from './match-3';
import { createOpeningBoard, removeMatchedOrbsAndRefill } from './board-generation';
import { makeBoard, DEADLOCKED_GRID, EARLY_MOVE_GRID, LATE_MOVE_GRID, MATCH_GRID, LATE_MOVE } from './match-3.fixtures';
import { createSeededRandom } from './math';

// Fixtures are built once. Bench labels are stable across the playability rewrite so the
// before/after table in BOARD_PLAYABILITY_PLAN.md lines up.
const settled = makeBoard(LATE_MOVE_GRID);
const early = makeBoard(EARLY_MOVE_GRID);
const dead = makeBoard(DEADLOCKED_GRID);
const withRun = makeBoard(MATCH_GRID);

const THREE_ORB_MATCH = new Set(['0-0', '0-1', '0-2']);
const ROW_CLEAR = new Set(settled[3].map((orb) => orb.id));
const COLUMN_CLEAR = new Set(settled.map((row) => row[5].id));

const rng = createSeededRandom(1);

describe('createInitialBoard', () => {
  bench('opening board 8x6', () => {
    createOpeningBoard(undefined, undefined, rng);
  });
});

describe('findLineMatches', () => {
  bench('settled board (LATE_MOVE)', () => {
    findLineMatches(settled);
  });

  bench('board with a 4-run (MATCH_GRID)', () => {
    findLineMatches(withRun);
  });
});

describe('hasAnyLineMatch', () => {
  bench('settled board (LATE_MOVE)', () => {
    hasAnyLineMatch(settled);
  });

  bench('board with a 4-run (MATCH_GRID)', () => {
    hasAnyLineMatch(withRun);
  });
});

describe('countLineRuns', () => {
  bench('settled board (LATE_MOVE)', () => {
    countLineRuns(settled);
  });
});

describe('hasMatchAtPosition', () => {
  bench('cell (7,2) on settled board', () => {
    hasMatchAtPosition(settled, 7, 2);
  });
});

describe('isValidSwap', () => {
  bench('valid swap (7,2)↔(7,3)', () => {
    isValidSwap(settled, LATE_MOVE.from, LATE_MOVE.to);
  });

  bench('invalid swap (0,0)↔(0,1) on DEADLOCKED', () => {
    isValidSwap(dead, { row: 0, col: 0 }, { row: 0, col: 1 });
  });
});

describe('swapOrbs', () => {
  bench('adjacent swap', () => {
    swapOrbs(settled, LATE_MOVE.from, LATE_MOVE.to);
  });
});

describe('findPossibleMove', () => {
  bench('early hit (EARLY_MOVE, row 0)', () => {
    findPossibleMove(early);
  });

  bench('late hit (LATE_MOVE, row 7)', () => {
    findPossibleMove(settled);
  });

  bench('dead board (full 68-window scan)', () => {
    findPossibleMove(dead);
  });
});

describe('isBoardPlayable', () => {
  bench('board with a move (EARLY_MOVE)', () => {
    isBoardPlayable(early);
  });

  bench('dead board', () => {
    isBoardPlayable(dead);
  });
});

describe('removeMatchedOrbsAndRefill', () => {
  bench('3-orb match (row 0, cols 0-2)', () => {
    removeMatchedOrbsAndRefill(settled, THREE_ORB_MATCH, { bombRefillChance: 0, rng });
  });

  bench('6-orb row clear (row 3)', () => {
    removeMatchedOrbsAndRefill(settled, ROW_CLEAR, { bombRefillChance: 0, rng });
  });

  bench('8-orb column clear (col 5)', () => {
    removeMatchedOrbsAndRefill(settled, COLUMN_CLEAR, { bombRefillChance: 0, rng });
  });
});
