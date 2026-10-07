import type { PixelRect } from '~/types/geometry';
import type { JirbySymbolCell, JirbySymbolName, JirbySymbolTone } from '~/types/jirby-symbols';
import {
  JIRBY_BARE_COL_OFFSET,
  JIRBY_COLOR_SYMBOLS,
  JIRBY_SYMBOL_SHEET,
  JIRBY_WHITE_ROW_OFFSET,
  JIRBY_WHITE_SYMBOLS,
} from '~/constants/jirby-symbols';

/**
 * Locates a symbol on the Jirby sheet, in any of its four blocks.
 *
 * @param tone `'color'` for the top blocks, `'white'` for the bottom ones.
 * @param name The symbol's name in that tone's map.
 * @param isOutlined `true` for the white-outlined (left) block, `false` for the bare (right) one.
 * @returns The `[col, row]` cell, or `null` when the tone has no such symbol.
 */
export function getJirbySymbolCell(
  tone: JirbySymbolTone,
  name: JirbySymbolName,
  isOutlined: boolean,
): JirbySymbolCell | null {
  const symbols: Readonly<Record<string, JirbySymbolCell>> =
    tone === 'color' ? JIRBY_COLOR_SYMBOLS : JIRBY_WHITE_SYMBOLS;
  const cell = symbols[name];
  if (!cell) return null;

  const [col, row] = cell;
  return [col + (isOutlined ? 0 : JIRBY_BARE_COL_OFFSET), row + (tone === 'white' ? JIRBY_WHITE_ROW_OFFSET : 0)];
}

/**
 * A symbol's source rectangle on the sheet, in sheet pixels, for `drawImage`.
 *
 * @param tone See {@link getJirbySymbolCell}.
 * @param name See {@link getJirbySymbolCell}.
 * @param isOutlined See {@link getJirbySymbolCell}.
 * @returns The rect, or `null` when the tone has no such symbol.
 */
export function getJirbySymbolRect(
  tone: JirbySymbolTone,
  name: JirbySymbolName,
  isOutlined: boolean,
): PixelRect | null {
  const cell = getJirbySymbolCell(tone, name, isOutlined);
  if (!cell) return null;

  const { cellSize } = JIRBY_SYMBOL_SHEET;
  return { x: cell[0] * cellSize, y: cell[1] * cellSize, width: cellSize, height: cellSize };
}
