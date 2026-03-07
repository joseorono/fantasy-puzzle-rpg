import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const styledButtonVariants = cva(
  'styled-button inline-flex items-center justify-center rounded-full border-none cursor-pointer font-bold uppercase tracking-wide select-none outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      variant: {
        tan: 'styled-button--tan',
        mauve: 'styled-button--mauve',
        orange: 'styled-button--orange',
        cream: 'styled-button--cream',
        gray: 'styled-button--gray',
      },
      size: {
        default: 'styled-button--pill px-6 py-3 min-h-12 text-sm',
        sm: 'styled-button--pill px-4 py-2 min-h-10 text-xs',
        lg: 'styled-button--pill px-8 py-4 min-h-14 text-base',
        circle: 'styled-button--circle w-12 h-12 min-w-12 min-h-12 text-base',
        'circle-sm': 'styled-button--circle w-10 h-10 min-w-10 min-h-10 text-sm',
        'circle-lg': 'styled-button--circle w-14 h-14 min-w-14 min-h-14 text-lg',
      },
    },
    defaultVariants: {
      variant: 'tan',
      size: 'default',
    },
  },
);

interface StyledButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof styledButtonVariants> {}

export function StyledButton({ className, variant, size, ...props }: StyledButtonProps) {
  return <button className={cn(styledButtonVariants({ variant, size, className }))} {...props} />;
}

export { styledButtonVariants };
