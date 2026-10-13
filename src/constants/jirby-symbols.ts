import type { JirbyColorSymbolName, JirbySymbolCell, JirbyWhiteSymbolName } from '~/types/jirby-symbols';

/*
 * Jirby map symbols — LittleMaps 16×16 sprite sheet.
 *
 * 208×176 px → 13 cols × 11 rows of 16 px cells. Four 6×5 blocks of the same symbols,
 * split by an empty gutter column (6) and row (5):
 *   top-left: color + white outline    top-right: color
 *   bottom-left: white + white outline bottom-right: white
 * The white blocks fold the colored books and pins into one of each.
 */

export const JIRBY_SYMBOL_SHEET = {
  image: '/assets/icons/jirby-symbols-16x16.png',
  cellSize: 16,
  cols: 13,
  rows: 11,
} as const;

/** Where the un-outlined (right) blocks start, in cells. */
export const JIRBY_BARE_COL_OFFSET = 7;

/** Where the white (bottom) blocks start, in cells. */
export const JIRBY_WHITE_ROW_OFFSET = 6;

/** Icon name → [col, row] in the color + outline block. */
export const JIRBY_COLOR_SYMBOLS = {
  /* ── Row 0: Marks ──────────────────────────────────────── */
  skull: [0, 0],
  star: [1, 0],
  exclamation: [2, 0],
  question: [3, 0],
  heart: [4, 0],
  check: [5, 0],

  /* ── Row 1: Places / treasures ─────────────────────────── */
  topaz: [0, 1],
  tombstone: [1, 1],
  house: [2, 1],
  crook: [3, 1],
  diamond: [4, 1],
  beast: [5, 1],

  /* ── Row 2: Loot ───────────────────────────────────────── */
  coin: [0, 2],
  cross: [1, 2],
  chest: [2, 2],
  potion: [3, 2],
  letter: [4, 2],
  key: [5, 2],

  /* ── Row 3: Gear / books ───────────────────────────────── */
  sword: [0, 3],
  anvil: [1, 3],
  purpleBook: [2, 3],
  brownBook: [3, 3],
  openBook: [4, 3],
  tome: [5, 3],

  /* ── Row 4: Pins ───────────────────────────────────────── */
  pinRed: [0, 4],
  pinYellow: [1, 4],
  pinTeal: [2, 4],
  pinGreen: [3, 4],
  pinBlue: [4, 4],
  pinGray: [5, 4],
} as const satisfies Record<string, JirbySymbolCell>;

/** Icon name → [col, row] in the white + outline block, relative to its top-left cell. */
export const JIRBY_WHITE_SYMBOLS = {
  skull: [0, 0],
  star: [1, 0],
  exclamation: [2, 0],
  question: [3, 0],
  heart: [4, 0],
  check: [5, 0],

  topaz: [0, 1],
  tombstone: [1, 1],
  house: [2, 1],
  crook: [3, 1],
  diamond: [4, 1],
  beast: [5, 1],

  coin: [0, 2],
  cross: [1, 2],
  chest: [2, 2],
  potion: [3, 2],
  letter: [4, 2],
  key: [5, 2],

  sword: [0, 3],
  anvil: [1, 3],
  book: [2, 3],
  openBook: [3, 3],
  tome: [4, 3],

  pin: [0, 4],
} as const satisfies Record<string, JirbySymbolCell>;

/** Every colored symbol, in sheet order. */
export const JIRBY_COLOR_SYMBOL_NAMES = Object.keys(JIRBY_COLOR_SYMBOLS) as JirbyColorSymbolName[];

/** Every white symbol, in sheet order. */
export const JIRBY_WHITE_SYMBOL_NAMES = Object.keys(JIRBY_WHITE_SYMBOLS) as JirbyWhiteSymbolName[];
