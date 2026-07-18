import { cn } from '~/lib/utils';

type GradientDividerVariant = 'gold' | 'red';

interface GradientDividerProps {
  variant?: GradientDividerVariant;
  className?: string;
}

export function GradientDivider({ variant = 'gold', className }: GradientDividerProps) {
  return (
    <div className={cn('gradient-divider', `gradient-divider--${variant}`, className)} />
  );
}
