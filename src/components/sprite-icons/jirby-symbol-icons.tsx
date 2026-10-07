/**
 * Jirby map symbols — LittleMaps 16×16 sprite sheet.
 *
 * Sprite sheet: 208×176 px → 13 cols × 11 rows, 16 px cells. Four 6×5 blocks of the same
 * symbols, split by an empty gutter column (6) and row (5):
 *   top-left: color + white outline    top-right: color
 *   bottom-left: white + white outline bottom-right: white
 * The white blocks fold the colored books and pins into one of each.
 *
 * Usage:
 *   <JirbySymbolIcon name="chest" />                      // native 16px, outlined
 *   <JirbySymbolIcon name="pinRed" size={32} isOutlined={false} />
 *   <JirbySymbolIcon tone="white" name="pin" size={32} />
 */

import { cn } from '~/lib/utils';
import { SpriteIcon, type SpriteSheetConfig } from './sprite-icon';

const CONFIG: SpriteSheetConfig = {
  image: '/assets/icons/jirby-symbols-16x16.png',
  cellW: 16,
  cellH: 16,
  cols: 13, // 208 / 16
  rows: 11, // 176 / 16
};

/** Where the un-outlined (right) and white (bottom) blocks start, in cells. */
const BARE_COL_OFFSET = 7;
const WHITE_ROW_OFFSET = 6;

type IconMap = Readonly<Record<string, readonly [col: number, row: number]>>;

/** Icon name → [col, row] in the color + outline block. */
const COLOR_ICON_MAP = {
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
} as const satisfies IconMap;

/** Icon name → [col, row] in the white + outline block, relative to its top-left cell. */
const WHITE_ICON_MAP = {
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
} as const satisfies IconMap;

function offsetIconMap(iconMap: IconMap, colOffset: number, rowOffset: number): IconMap {
  return Object.fromEntries(
    Object.entries(iconMap).map(([name, [col, row]]) => [name, [col + colOffset, row + rowOffset] as const]),
  );
}

const ICON_MAPS = {
  color: { outlined: COLOR_ICON_MAP, bare: offsetIconMap(COLOR_ICON_MAP, BARE_COL_OFFSET, 0) },
  white: {
    outlined: offsetIconMap(WHITE_ICON_MAP, 0, WHITE_ROW_OFFSET),
    bare: offsetIconMap(WHITE_ICON_MAP, BARE_COL_OFFSET, WHITE_ROW_OFFSET),
  },
} as const;

/** Valid icon name for the colored Jirby symbols. */
export type JirbyColorSymbolName = keyof typeof COLOR_ICON_MAP;

/** Valid icon name for the white Jirby symbols. */
export type JirbyWhiteSymbolName = keyof typeof WHITE_ICON_MAP;

/** Every colored symbol, in sheet order. */
export const JIRBY_COLOR_SYMBOL_NAMES = Object.keys(COLOR_ICON_MAP) as JirbyColorSymbolName[];

/** Every white symbol, in sheet order. */
export const JIRBY_WHITE_SYMBOL_NAMES = Object.keys(WHITE_ICON_MAP) as JirbyWhiteSymbolName[];

interface JirbySymbolIconBaseProps {
  /** Draws the white outline that lifts the symbol off busy backgrounds (default true). */
  isOutlined?: boolean;
  /** Rendered size in pixels (default = native 16px). Keep to multiples of 16 for crisp pixels. */
  size?: number;
  /** Additional CSS classes. */
  className?: string;
}

type JirbySymbolIconProps = JirbySymbolIconBaseProps &
  ({ tone?: 'color'; name: JirbyColorSymbolName } | { tone: 'white'; name: JirbyWhiteSymbolName });

export function JirbySymbolIcon({ tone = 'color', name, isOutlined = true, size, className }: JirbySymbolIconProps) {
  const iconMap = ICON_MAPS[tone][isOutlined ? 'outlined' : 'bare'];

  return (
    <SpriteIcon name={name} size={size} className={cn('jirby-art', className)} config={CONFIG} iconMap={iconMap} />
  );
}
