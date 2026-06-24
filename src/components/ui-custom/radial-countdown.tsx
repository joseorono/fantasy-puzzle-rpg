import type { CSSProperties, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const radialCountdownVariants = cva('radial-countdown', {
  variants: {
    size: {
      sm: 'radial-countdown--sm',
      md: 'radial-countdown--md',
      lg: 'radial-countdown--lg',
    },
    tone: {
      danger: 'radial-countdown--danger',
      gold: 'radial-countdown--gold',
      neutral: 'radial-countdown--neutral',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'danger',
  },
});

interface RadialCountdownProps extends VariantProps<typeof radialCountdownVariants> {
  /** Length of one countdown cycle, in milliseconds. */
  durationMs: number;
  /**
   * Change this value to restart the depletion from full (e.g. an attack
   * counter). The animated layer is keyed on it, so a new value remounts it and
   * replays the CSS animation.
   */
  cycleKey: number | string;
  /** Freeze the animation in place (e.g. while the game is paused). */
  paused?: boolean;
  /** Center content — typically an icon or a number. */
  children?: ReactNode;
  className?: string;
}

/**
 * A small circular countdown ring that depletes from full to empty entirely in
 * CSS. The only JavaScript involved is remounting the fill layer when
 * `cycleKey` changes; the depletion itself runs on the compositor via an
 * animated `conic-gradient` (no `requestAnimationFrame`, no per-tick state),
 * which keeps it cheap enough to reuse anywhere.
 */
export function RadialCountdown({
  durationMs,
  cycleKey,
  paused = false,
  size,
  tone,
  children,
  className,
}: RadialCountdownProps) {
  return (
    <div className={cn(radialCountdownVariants({ size, tone, className }))}>
      <span
        key={cycleKey}
        className="radial-countdown__fill"
        style={
          {
            animationDuration: `${durationMs}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          } as CSSProperties
        }
      />
      {children != null && <span className="radial-countdown__center">{children}</span>}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { radialCountdownVariants };
