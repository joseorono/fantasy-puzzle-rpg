import { cn } from '~/lib/utils';

interface ArrowRightIconProps {
  className?: string;
}

/**
 * The indigolay right arrow, for "from → to" readouts. Use this instead of a "→" character:
 * the pixel font has no arrow glyph, so the text arrow falls back to a mismatched font.
 * Sized in `em` by default (`.arrow-right-icon`), so it follows the surrounding text.
 */
export function ArrowRightIcon({ className }: ArrowRightIconProps) {
  return (
    <img
      className={cn('arrow-right-icon', className)}
      src="/assets/icons/indigolay/Icon_arrow-right.png"
      alt="to"
      draggable={false}
    />
  );
}
