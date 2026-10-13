import type { JIRBY_COLOR_SYMBOLS, JIRBY_WHITE_SYMBOLS } from '~/constants/jirby-symbols';

/** A cell of the Jirby symbol sheet, in cells (not pixels). */
export type JirbySymbolCell = readonly [col: number, row: number];

/** Which half of the sheet: colored symbols (top) or white ones (bottom). */
export type JirbySymbolTone = 'color' | 'white';

/** Valid icon name for the colored Jirby symbols. */
export type JirbyColorSymbolName = keyof typeof JIRBY_COLOR_SYMBOLS;

/** Valid icon name for the white Jirby symbols. */
export type JirbyWhiteSymbolName = keyof typeof JIRBY_WHITE_SYMBOLS;

export type JirbySymbolName = JirbyColorSymbolName | JirbyWhiteSymbolName;
