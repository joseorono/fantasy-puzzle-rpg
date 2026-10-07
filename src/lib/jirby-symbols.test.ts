import { describe, expect, it } from 'vitest';
import { getJirbySymbolCell, getJirbySymbolRect } from './jirby-symbols';
import {
  JIRBY_BARE_COL_OFFSET,
  JIRBY_COLOR_SYMBOL_NAMES,
  JIRBY_SYMBOL_SHEET,
  JIRBY_WHITE_ROW_OFFSET,
  JIRBY_WHITE_SYMBOL_NAMES,
} from '~/constants/jirby-symbols';
import { MAP_NODE_MARKER_STYLES } from '~/constants/map';

const BLOCKS = [
  ['color', true],
  ['color', false],
  ['white', true],
  ['white', false],
] as const;

describe('getJirbySymbolCell', () => {
  it('finds a symbol in each of the four blocks', () => {
    expect(getJirbySymbolCell('color', 'chest', true)).toEqual([2, 2]);
    expect(getJirbySymbolCell('color', 'chest', false)).toEqual([2 + JIRBY_BARE_COL_OFFSET, 2]);
    expect(getJirbySymbolCell('white', 'chest', true)).toEqual([2, 2 + JIRBY_WHITE_ROW_OFFSET]);
    expect(getJirbySymbolCell('white', 'chest', false)).toEqual([
      2 + JIRBY_BARE_COL_OFFSET,
      2 + JIRBY_WHITE_ROW_OFFSET,
    ]);
  });

  it('returns null for a symbol the tone lacks', () => {
    expect(getJirbySymbolCell('white', 'pinRed', true)).toBeNull();
    expect(getJirbySymbolCell('color', 'pin', true)).toBeNull();
  });

  it('keeps every symbol of every block on the sheet and off the gutters', () => {
    for (const [tone, isOutlined] of BLOCKS) {
      const names = tone === 'color' ? JIRBY_COLOR_SYMBOL_NAMES : JIRBY_WHITE_SYMBOL_NAMES;
      for (const name of names) {
        const cell = getJirbySymbolCell(tone, name, isOutlined);
        expect(cell).not.toBeNull();
        const [col, row] = cell!;
        expect(col).toBeLessThan(JIRBY_SYMBOL_SHEET.cols);
        expect(row).toBeLessThan(JIRBY_SYMBOL_SHEET.rows);
        expect(col).not.toBe(JIRBY_BARE_COL_OFFSET - 1);
        expect(row).not.toBe(JIRBY_WHITE_ROW_OFFSET - 1);
      }
    }
  });

  it('has both tones of every map node symbol', () => {
    for (const style of Object.values(MAP_NODE_MARKER_STYLES)) {
      expect(getJirbySymbolCell('color', style.symbol, false)).not.toBeNull();
      expect(getJirbySymbolCell('white', style.whiteSymbol, false)).not.toBeNull();
    }
  });
});

describe('getJirbySymbolRect', () => {
  it('converts the cell to sheet pixels', () => {
    const size = JIRBY_SYMBOL_SHEET.cellSize;
    expect(getJirbySymbolRect('color', 'coin', false)).toEqual({
      x: JIRBY_BARE_COL_OFFSET * size,
      y: 2 * size,
      width: size,
      height: size,
    });
  });

  it('returns null for a symbol the tone lacks', () => {
    expect(getJirbySymbolRect('white', 'purpleBook', false)).toBeNull();
  });
});
