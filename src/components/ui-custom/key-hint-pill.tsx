import { Fragment, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const keyHintPillVariants = cva('key-hint-pill pixel-font', {
  variants: {
    size: {
      sm: 'key-hint-pill--sm',
      md: 'key-hint-pill--md',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const ARROW_ROTATIONS: Record<string, number> = { '↑': 0, '→': 90, '↓': 180, '←': 270 };

/** Arrow keys render as an SVG triangle; Press Start 2P has no arrows and falls back to a thin system font. */
function KeyGlyph({ keyName }: { keyName: string }) {
  const rotation = ARROW_ROTATIONS[keyName];
  if (rotation === undefined) return keyName;

  return (
    <svg
      className="key-hint-pill__arrow"
      viewBox="0 0 10 10"
      style={{ transform: `rotate(${rotation}deg)` }}
      role="img"
      aria-label={keyName}
    >
      <path d="M5 2.5 8.5 7.5h-7z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** One "keys + action" hint inside a KeyHintPill. */
export interface KeyHintItem {
  /** Keys rendered as chips, in order (e.g. ['←', '→'] or ['Enter']). */
  keys: string[];
  /** What the keys do. */
  label: string;
}

interface KeyHintPillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof keyHintPillVariants> {
  items: KeyHintItem[];
  /** Glyph separating hint groups. */
  separator?: string;
}

/** A dark rounded bar of keyboard hints: key chips plus a short label per group. */
export function KeyHintPill({ items, separator = '·', size, className, ...rest }: KeyHintPillProps) {
  return (
    <span className={cn(keyHintPillVariants({ size }), className)} {...rest}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="key-hint-pill__sep">{separator}</span>}
          <span className="key-hint-pill__item">
            {item.keys.map((key) => (
              <kbd key={key} className="key-hint-pill__key">
                <KeyGlyph keyName={key} />
              </kbd>
            ))}
            <span className="key-hint-pill__label">{item.label}</span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
