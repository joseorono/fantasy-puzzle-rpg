import { cva, type VariantProps } from 'class-variance-authority';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { cn } from '~/lib/utils';

const experienceBarVariants = cva('exp-bar', {
  variants: {
    variant: {
      compact: 'exp-bar--compact',
      full: 'exp-bar--full',
    },
  },
  defaultVariants: {
    variant: 'full',
  },
});

/** Variant → IndigolayBar size. `full` maps to `lg`, matching the level-up screen's EXP bar. */
const EXP_BAR_SIZE = {
  compact: 'xs',
  full: 'lg',
} as const;

const DEFAULT_EXP_BAR_VARIANT = 'full';

interface ExperienceBarProps extends VariantProps<typeof experienceBarVariants> {
  /** Fill percentage (0–100) */
  percentage: number;
  /** Optional text overlay (e.g. "45 / 100") */
  label?: React.ReactNode;
  className?: string;
}

/**
 * The game's EXP bar: an {@link IndigolayBar} in the shared yellow fill, plus the
 * white flash it pops on landing at 100%. The flash is a sheet fading out rather
 * than a keyframe on the fill, which is a `border-image` sprite with no background.
 */
export function ExperienceBar({ percentage, label, variant, className }: ExperienceBarProps) {
  const resolvedVariant = variant ?? DEFAULT_EXP_BAR_VARIANT;

  return (
    <IndigolayBar
      className={cn(experienceBarVariants({ variant: resolvedVariant, className }))}
      variant="yellow"
      size={EXP_BAR_SIZE[resolvedVariant]}
      percentage={percentage}
      label={label}
      // Not on a layer: IndigolayBar's layer onAnimationEnd clears its crossfade
      // state without checking which animation ended.
      overlay={percentage >= 100 ? <span className="exp-bar__flash" /> : null}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { experienceBarVariants };
