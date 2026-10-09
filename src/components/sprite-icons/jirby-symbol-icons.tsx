/**
 * Jirby map symbols — LittleMaps 16×16 sprite sheet. Sheet layout and names live in
 * src/constants/jirby-symbols.ts.
 *
 * Usage:
 *   <JirbySymbolIcon name="chest" />                      // native 16px, outlined
 *   <JirbySymbolIcon name="pinRed" size={32} isOutlined={false} />
 *   <JirbySymbolIcon tone="white" name="pin" size={32} />
 */

import type { JirbyColorSymbolName, JirbyWhiteSymbolName } from '~/types/jirby-symbols';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';
import { getJirbySymbolCell } from '~/lib/jirby-symbols';
import { cn } from '~/lib/utils';
import { SpriteIcon, type SpriteSheetConfig } from './sprite-icon';

const CONFIG: SpriteSheetConfig = {
  image: JIRBY_SYMBOL_SHEET.image,
  cellW: JIRBY_SYMBOL_SHEET.cellSize,
  cellH: JIRBY_SYMBOL_SHEET.cellSize,
  cols: JIRBY_SYMBOL_SHEET.cols,
  rows: JIRBY_SYMBOL_SHEET.rows,
};

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
  const cell = getJirbySymbolCell(tone, name, isOutlined);
  if (!cell) return null;

  return (
    <SpriteIcon
      name={name}
      size={size}
      className={cn('jirby-art', className)}
      config={CONFIG}
      iconMap={{ [name]: cell }}
    />
  );
}
