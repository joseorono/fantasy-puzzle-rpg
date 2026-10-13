import { describe, it, expect } from 'vitest';
import {
  getLineCount,
  getLineOrbIds,
  getSweepDelays,
  groupOrbsByColor,
  pickBestLine,
  resolveLineClearOrbs,
} from './line-clear';
import { makeBoard, type CellToken } from './match-3.fixtures';
import { INITIAL_PARTY } from '~/constants/party';
import { LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT, LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT } from '~/constants/battle';
import type { CharacterData } from '~/types/rpg-elements';

/**
 * A compact 4x4 board keeps the expectations readable; nothing in line-clear depends on the
 * shipped 8x6 dimensions, which `getLineCount` reads off the board it is handed.
 */
const GRID: CellToken[][] = [
  ['blue', 'green', 'purple', 'yellow'],
  ['gray', 'blue', 'blue', 'green'],
  ['purple', 'purple', 'gray', 'blue'],
  ['yellow', 'yellow', 'green', 'gray'],
];

const BOARD = makeBoard(GRID);

/** Orb ids from `makeBoard` are "row-col", so a line's ids can be written out directly. */
function ids(...positions: string[]): Set<string> {
  return new Set(positions);
}

function killColor(party: CharacterData[], color: string): CharacterData[] {
  return party.map((char) => (char.color === color ? { ...char, currentHp: 0 } : char));
}

describe('getLineCount', () => {
  it('counts rows or columns off the board it is given', () => {
    const wide = makeBoard([
      ['blue', 'green', 'gray'],
      ['blue', 'green', 'gray'],
    ]);
    expect(getLineCount(wide, 'row')).toBe(2);
    expect(getLineCount(wide, 'column')).toBe(3);
  });
});

describe('getLineOrbIds', () => {
  it('takes a whole row', () => {
    expect(getLineOrbIds(BOARD, 'row', 1)).toEqual(ids('1-0', '1-1', '1-2', '1-3'));
  });

  it('takes a whole column', () => {
    expect(getLineOrbIds(BOARD, 'column', 2)).toEqual(ids('0-2', '1-2', '2-2', '3-2'));
  });

  it('returns nothing for an index off the board', () => {
    expect(getLineOrbIds(BOARD, 'row', -1).size).toBe(0);
    expect(getLineOrbIds(BOARD, 'row', 4).size).toBe(0);
    expect(getLineOrbIds(BOARD, 'column', 4).size).toBe(0);
  });
});

describe('resolveLineClearOrbs', () => {
  it('clears exactly the line when it holds no bomb', () => {
    expect(resolveLineClearOrbs(BOARD, 'row', 0)).toEqual(getLineOrbIds(BOARD, 'row', 0));
  });

  it('detonates a bomb caught in the line, taking its 3x3 with it', () => {
    // A bomb at the centre of the board: its blast reaches every neighbouring cell.
    const board = makeBoard(GRID.map((row, r) => row.map((cell, c) => (r === 2 && c === 1 ? '*' : cell))));
    const cleared = resolveLineClearOrbs(board, 'row', 2);

    expect(cleared).toEqual(ids('2-0', '2-1', '2-2', '2-3', '1-0', '1-1', '1-2', '3-0', '3-1', '3-2'));
  });

  it('chain-detonates a bomb caught in another bomb blast', () => {
    const board = makeBoard(
      GRID.map((row, r) => row.map((cell, c) => ((r === 1 && c === 1) || (r === 2 && c === 2) ? '*' : cell))),
    );
    const cleared = resolveLineClearOrbs(board, 'row', 1);

    // Row 1 detonates the bomb at 1-1, whose blast catches the bomb at 2-2, which reaches row 3.
    expect(cleared.has('3-1')).toBe(true);
    expect(cleared.has('3-2')).toBe(true);
    expect(cleared.has('3-3')).toBe(true);
  });

  it('returns nothing for an index off the board', () => {
    expect(resolveLineClearOrbs(BOARD, 'column', 9).size).toBe(0);
  });
});

describe('groupOrbsByColor', () => {
  it('counts each colour on the cleared line', () => {
    expect(groupOrbsByColor(BOARD, getLineOrbIds(BOARD, 'row', 1))).toEqual([
      { type: 'gray', matchSize: 1 },
      { type: 'blue', matchSize: 2 },
      { type: 'green', matchSize: 1 },
    ]);
  });

  it('orders groups by board scan order, so the first seen colour drives the pulse', () => {
    expect(groupOrbsByColor(BOARD, getLineOrbIds(BOARD, 'column', 0))[0]).toEqual({ type: 'blue', matchSize: 1 });
  });

  it('skips bombs, which are wildcards with no colour to pay out', () => {
    const board = makeBoard(GRID.map((row, r) => row.map((cell, c) => (r === 0 && c === 0 ? '*' : cell))));
    const groups = groupOrbsByColor(board, getLineOrbIds(board, 'row', 0));

    expect(groups.reduce((total, group) => total + group.matchSize, 0)).toBe(3);
    expect(groups).not.toContainEqual(expect.objectContaining({ type: 'gray' }));
  });

  it('counts orbs taken by a blast, not just the line itself', () => {
    const board = makeBoard(GRID.map((row, r) => row.map((cell, c) => (r === 2 && c === 1 ? '*' : cell))));
    const total = groupOrbsByColor(board, resolveLineClearOrbs(board, 'row', 2)).reduce(
      (sum, group) => sum + group.matchSize,
      0,
    );

    // 10 orbs destroyed, one of which is the bomb itself and pays out no colour.
    expect(total).toBe(9);
  });
});

describe('pickBestLine', () => {
  /** rng that always keeps the incumbent, so ties resolve to the lowest index. */
  const keepFirst = () => 0.99;

  it('prefers the line holding a bomb', () => {
    const board = makeBoard(GRID.map((row, r) => row.map((cell, c) => (r === 3 && c === 3 ? '*' : cell))));
    expect(pickBestLine(board, 'row', INITIAL_PARTY, keepFirst)).toBe(3);
  });

  it('prefers living heroes’ colours over a dead one’s', () => {
    // Row 0 is all-blue, row 1 all-green: with the warrior (blue) dead, green wins.
    const board = makeBoard([
      ['blue', 'blue', 'blue', 'blue'],
      ['green', 'green', 'green', 'green'],
    ]);

    expect(pickBestLine(board, 'row', INITIAL_PARTY, keepFirst)).toBe(0);
    expect(pickBestLine(board, 'row', killColor(INITIAL_PARTY, 'blue'), keepFirst)).toBe(1);
  });

  it('prefers a colour a hero can act on over gray', () => {
    const board = makeBoard([
      ['gray', 'gray', 'gray', 'gray'],
      ['blue', 'blue', 'blue', 'blue'],
    ]);
    expect(pickBestLine(board, 'row', INITIAL_PARTY, keepFirst)).toBe(1);
    expect(LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT).toBeLessThan(1);
  });

  it('prefers gray over a dead hero’s colour, which is worth nothing', () => {
    const board = makeBoard([
      ['blue', 'blue', 'blue', 'blue'],
      ['gray', 'gray', 'gray', 'gray'],
    ]);
    expect(pickBestLine(board, 'row', killColor(INITIAL_PARTY, 'blue'), keepFirst)).toBe(1);
  });

  it('weighs a bomb above the orbs it sits among', () => {
    expect(LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT).toBeGreaterThan(1);
  });

  it('breaks ties through the injected rng rather than always taking the first line', () => {
    const board = makeBoard([
      ['blue', 'blue', 'blue', 'blue'],
      ['blue', 'blue', 'blue', 'blue'],
      ['blue', 'blue', 'blue', 'blue'],
    ]);

    // Every row scores the same; an rng that always accepts the challenger lands on the last one.
    expect(pickBestLine(board, 'row', INITIAL_PARTY, () => 0)).toBe(2);
    expect(pickBestLine(board, 'row', INITIAL_PARTY, keepFirst)).toBe(0);
  });

  it('searches columns when asked for a column', () => {
    const board = makeBoard([
      ['gray', 'gray', 'blue', 'gray'],
      ['gray', 'gray', 'blue', 'gray'],
    ]);
    expect(pickBestLine(board, 'column', INITIAL_PARTY, keepFirst)).toBe(2);
  });
});

describe('getSweepDelays', () => {
  it('staggers a row left to right, one slot per column', () => {
    const delays = getSweepDelays(BOARD, getLineOrbIds(BOARD, 'row', 2), 'row', 40);

    expect(delays).toEqual(
      new Map([
        ['2-0', 0],
        ['2-1', 40],
        ['2-2', 80],
        ['2-3', 120],
      ]),
    );
  });

  it('staggers a column top to bottom, one slot per row', () => {
    const delays = getSweepDelays(BOARD, getLineOrbIds(BOARD, 'column', 1), 'column', 25);

    expect(delays).toEqual(
      new Map([
        ['0-1', 0],
        ['1-1', 25],
        ['2-1', 50],
        ['3-1', 75],
      ]),
    );
  });

  it('pops a blast orb in the same slot as the line cell beside it', () => {
    const board = makeBoard([
      ['blue', 'green', 'purple', 'yellow'],
      ['gray', '*', 'blue', 'green'],
      ['purple', 'purple', 'gray', 'blue'],
      ['yellow', 'yellow', 'green', 'gray'],
    ]);
    const delays = getSweepDelays(board, resolveLineClearOrbs(board, 'row', 1), 'row', 40);

    // The bomb at 1-1 takes its column neighbours 0-1 and 2-1 with it; they pop with it, not after.
    expect(delays.get('0-1')).toBe(40);
    expect(delays.get('1-1')).toBe(40);
    expect(delays.get('2-1')).toBe(40);
    expect(delays.get('2-2')).toBe(80);
    expect(delays.size).toBe(resolveLineClearOrbs(board, 'row', 1).size);
  });

  it('returns nothing for an empty set', () => {
    expect(getSweepDelays(BOARD, new Set(), 'row', 40).size).toBe(0);
  });
});
