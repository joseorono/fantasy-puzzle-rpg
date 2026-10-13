import type { CSSProperties } from 'react';
import type { LineOrientation } from '~/types/battle';
import { BOARD_COLS, BOARD_ROWS } from '~/constants/board';
import { LINE_CLEAR_SWEEP_MS } from '~/constants/battle';

export interface LineClearSweepEvent {
  orientation: LineOrientation;
  index: number;
  /** A new timestamp replays the streak. */
  timestamp: number;
}

interface LineClearSweepProps {
  sweep: LineClearSweepEvent | null;
}

/**
 * The streak that tears along a cleared line. Sits over the board grid and mirrors its padding, so
 * a band placed by percentages lands on the orbs' content box: one orb tall (or wide), at the
 * cleared line's slot. Orbs share one size and margin, so the slots divide the box evenly.
 */
export function LineClearSweep({ sweep }: LineClearSweepProps) {
  if (!sweep) return null;

  const isRow = sweep.orientation === 'row';
  const lineCount = isRow ? BOARD_ROWS : BOARD_COLS;
  const offset = `${(sweep.index / lineCount) * 100}%`;
  const extent = `${100 / lineCount}%`;

  // `--streak-angle` is a custom property, so the band is built loosely and cast on the way in.
  const bandStyle: Record<string, string | number> = isRow
    ? { top: offset, left: 0, width: '100%', height: extent, '--streak-angle': '90deg' }
    : { left: offset, top: 0, height: '100%', width: extent, '--streak-angle': '180deg' };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden p-2 sm:p-3 md:p-4" aria-hidden="true">
      <div className="relative h-full w-full">
        <div
          key={sweep.timestamp}
          className="line-clear-streak absolute rounded-full"
          style={
            {
              ...bandStyle,
              animation: `${isRow ? 'line-sweep-x' : 'line-sweep-y'} ${LINE_CLEAR_SWEEP_MS}ms ease-in forwards`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}
