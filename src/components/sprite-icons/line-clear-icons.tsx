/**
 * Pixel icons for the two line-clear consumables. The Frosty sheet has no row/column glyph, so
 * these are drawn inline: a 4×4 mini-board of muted orbs with the target line lit in amber and a
 * parchment streak running through it. Crisp edges at any size.
 */

import type { CSSProperties } from 'react';
import { cn } from '~/lib/utils';

export interface LineClearIconProps {
  /** Rendered size in pixels (default 24, the sheet icons' native size). */
  size?: number;
  className?: string;
}

/** Muted board colours, dulled so the amber line is the only thing that reads as "lit". */
const ORB_FILLS = ['#4f6f9c', '#5c8a5a', '#7b5f96', '#7d7a74'] as const;
const OUTLINE = '#3a1d08';
const LINE_FILL = '#e0a33a';
const LINE_HIGHLIGHT = '#f6c453';
const STREAK = '#fff3d6';

/** Top-left corner of each 4px orb on the 24px canvas: a 2px margin, then 5px pitch. */
const SLOTS = [2, 7, 12, 17] as const;

const PIXELATED: CSSProperties = { imageRendering: 'pixelated' };

interface MiniBoardProps extends LineClearIconProps {
  orientation: 'row' | 'column';
  label: string;
}

function MiniBoard({ orientation, label, size = 24, className }: MiniBoardProps) {
  // The lit line sits one in from the edge, so the icon reads as "this line, out of the board".
  const litIndex = 1;
  const isRow = orientation === 'row';

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={cn('si-icon', className)}
      style={PIXELATED}
    >
      <rect x="0" y="0" width="24" height="24" rx="1" fill={OUTLINE} opacity="0.35" />
      {SLOTS.map((y, rowIndex) =>
        SLOTS.map((x, colIndex) => {
          const isLit = (isRow ? rowIndex : colIndex) === litIndex;
          const fill = isLit ? LINE_FILL : ORB_FILLS[(rowIndex + colIndex) % ORB_FILLS.length];
          return (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect x={x} y={y} width="4" height="4" fill={fill} />
              {/* One bright pixel as a highlight, brighter on the lit line. */}
              <rect x={x} y={y} width="1" height="1" fill={isLit ? STREAK : 'rgba(255,255,255,0.35)'} />
              {isLit && <rect x={x + 3} y={y + 3} width="1" height="1" fill={OUTLINE} opacity="0.6" />}
            </g>
          );
        }),
      )}
      {/* The streak: a thin parchment line through the lit orbs, running off both edges. */}
      {isRow ? (
        <>
          <rect x="0" y={SLOTS[litIndex] + 1} width="24" height="1" fill={LINE_HIGHLIGHT} />
          <rect x="1" y={SLOTS[litIndex] + 2} width="22" height="1" fill={STREAK} opacity="0.9" />
        </>
      ) : (
        <>
          <rect x={SLOTS[litIndex] + 1} y="0" width="1" height="24" fill={LINE_HIGHLIGHT} />
          <rect x={SLOTS[litIndex] + 2} y="1" width="1" height="22" fill={STREAK} opacity="0.9" />
        </>
      )}
    </svg>
  );
}

export function RowClearIcon(props: LineClearIconProps) {
  return <MiniBoard orientation="row" label="Row Clear" {...props} />;
}

export function ColumnClearIcon(props: LineClearIconProps) {
  return <MiniBoard orientation="column" label="Column Clear" {...props} />;
}
