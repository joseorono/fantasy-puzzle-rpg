import { bench, describe } from 'vitest';
import {
  nextOrbId,
  getRandomOrbType,
  fillBoardRandom,
  fillBoardWithoutMatches,
  plantMove,
  createOpeningBoard,
  reshuffleBoard,
  ensurePlayableBoard,
  removeMatchedOrbsAndRefill,
} from './board-generation';
import {
  makeBoard,
  DEADLOCKED_GRID,
  DEADLOCKED_CORNER_BOMB_GRID,
  EARLY_MOVE_GRID,
  LATE_MOVE_GRID,
  MATCH_GRID,
} from './match-3.fixtures';
import { createSeededRandom } from './math';
import type { GridPosition } from '~/types/geometry';

const early = makeBoard(EARLY_MOVE_GRID);
const settled = makeBoard(LATE_MOVE_GRID);
const withRun = makeBoard(MATCH_GRID);
const dead = makeBoard(DEADLOCKED_GRID);
const deadWithBomb = makeBoard(DEADLOCKED_CORNER_BOMB_GRID);

const TOP_ROW_SPAWNS: GridPosition[] = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
];
const THREE_ORB_MATCH = new Set(['0-0', '0-1', '0-2']);
const ROW_CLEAR = new Set(settled[3].map((orb) => orb.id));
const COLUMN_CLEAR = new Set(settled.map((row) => row[5].id));

const rng = createSeededRandom(1);

describe('nextOrbId', () => {
  bench('next id', () => {
    nextOrbId();
  });
});

describe('getRandomOrbType', () => {
  bench('seeded draw', () => {
    getRandomOrbType(rng);
  });
});

describe('fillBoardRandom', () => {
  bench('8x6', () => {
    fillBoardRandom(undefined, undefined, rng);
  });
});

describe('fillBoardWithoutMatches', () => {
  bench('8x6', () => {
    fillBoardWithoutMatches(undefined, undefined, rng);
  });
});

describe('plantMove', () => {
  bench('dead board', () => {
    plantMove(dead, rng);
  });
});

describe('createOpeningBoard', () => {
  bench('8x6 (rejection-sampled deal)', () => {
    createOpeningBoard(undefined, undefined, rng);
  });

  bench('8x6 forced settled fallback (maxAttempts = 0)', () => {
    createOpeningBoard(undefined, undefined, rng, 0);
  });
});

describe('reshuffleBoard', () => {
  bench('dead board', () => {
    reshuffleBoard(dead, rng);
  });

  bench('dead board with a pinned bomb', () => {
    reshuffleBoard(deadWithBomb, rng);
  });
});

describe('ensurePlayableBoard', () => {
  bench('fast path: board with a move', () => {
    ensurePlayableBoard(early, TOP_ROW_SPAWNS, rng);
  });

  bench('fast path: pending match', () => {
    ensurePlayableBoard(withRun, TOP_ROW_SPAWNS, rng);
  });

  bench('dead board, 3 spawned (reroll path)', () => {
    ensurePlayableBoard(dead, TOP_ROW_SPAWNS, rng);
  });

  bench('dead board, forced reshuffle (maxRerolls = 0)', () => {
    ensurePlayableBoard(dead, TOP_ROW_SPAWNS, rng, 0);
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

  bench('3-orb match on a dead board (repair path)', () => {
    removeMatchedOrbsAndRefill(dead, THREE_ORB_MATCH, { bombRefillChance: 0, rng });
  });
});
