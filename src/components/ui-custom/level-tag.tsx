import { cn } from '~/lib/utils';
import { formatLevel } from '~/lib/text-utils';

interface LevelTagProps {
  level: number;
  className?: string;
}

/**
 * A red indigolay pennant that hangs from a portrait corner, displaying the
 * character's level as a fixed-width 2-digit number (1 → "01"). Replaces the old
 * rotated `.level-ribbon`. Positioning lives in `level-tag.css`; the parent must
 * be `position: relative`.
 */
export function LevelTag({ level, className }: LevelTagProps) {
  return (
    <div className={cn('level-tag', className)} aria-label={`Level ${level}`}>
      <span className="level-tag__num pixel-font">{formatLevel(level)}</span>
    </div>
  );
}
