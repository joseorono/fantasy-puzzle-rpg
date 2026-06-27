import { cva, type VariantProps } from 'class-variance-authority';
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

interface ExperienceBarProps extends VariantProps<typeof experienceBarVariants> {
  /** Fill percentage (0–100) */
  percentage: number;
  /** Optional text overlay (e.g. "45 / 100") */
  label?: string;
  className?: string;
}

export function ExperienceBar({ percentage, label, variant, className }: ExperienceBarProps) {
  return (
    <div className={cn(experienceBarVariants({ variant, className }))}>
      <div
        className={cn('exp-bar__fill', percentage >= 100 && 'exp-bar__fill--full')}
        style={{ width: `${percentage}%` }}
      />
      {label && <div className="exp-bar__label pixel-font text-xs">{label}</div>}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { experienceBarVariants };
