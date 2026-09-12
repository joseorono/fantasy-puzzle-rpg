import { Fragment, type HTMLAttributes } from 'react';
import { cn } from '~/lib/utils';

/** One "keys + action" hint inside a KeyHintPill. */
export interface KeyHintItem {
  /** Keys rendered as chips, in order (e.g. ['←', '→'] or ['Enter']). */
  keys: string[];
  /** What the keys do. */
  label: string;
}

interface KeyHintPillProps extends HTMLAttributes<HTMLSpanElement> {
  items: KeyHintItem[];
  /** Glyph separating hint groups. */
  separator?: string;
}

/** A dark rounded bar of keyboard hints: key chips plus a short label per group. */
export function KeyHintPill({ items, separator = '·', className, ...rest }: KeyHintPillProps) {
  return (
    <span className={cn('key-hint-pill pixel-font', className)} {...rest}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="key-hint-pill__sep">{separator}</span>}
          <span className="key-hint-pill__item">
            {item.keys.map((key) => (
              <kbd key={key} className="key-hint-pill__key">
                {key}
              </kbd>
            ))}
            <span className="key-hint-pill__label">{item.label}</span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
