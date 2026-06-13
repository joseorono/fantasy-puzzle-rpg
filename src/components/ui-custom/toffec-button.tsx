import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const toffecButtonVariants = cva(
  'toffec-button inline-flex items-center justify-center rounded-full border-none cursor-pointer font-bold uppercase tracking-wide select-none outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      variant: {
        tan: 'toffec-button--tan',
        mauve: 'toffec-button--mauve',
        orange: 'toffec-button--orange',
        cream: 'toffec-button--cream',
        gray: 'toffec-button--gray',
      },
      size: {
        default: 'toffec-button--pill px-6 py-3 min-h-12 text-sm',
        sm: 'toffec-button--pill px-4 py-2 min-h-10 text-xs',
        xs: 'toffec-button--pill px-3 py-1 min-h-8 text-[0.65rem]',
        lg: 'toffec-button--pill px-8 py-4 min-h-14 text-base',
        circle: 'toffec-button--circle w-12 h-12 min-w-12 min-h-12 text-base',
        'circle-sm': 'toffec-button--circle w-10 h-10 min-w-10 min-h-10 text-sm',
        'circle-lg': 'toffec-button--circle w-14 h-14 min-w-14 min-h-14 text-lg',
      },
    },
    defaultVariants: {
      variant: 'tan',
      size: 'default',
    },
  },
);

interface ToffecButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toffecButtonVariants> {}

export function ToffecButton({ className, variant, size, ...props }: ToffecButtonProps) {
  return <button className={cn(toffecButtonVariants({ variant, size, className }))} {...props} />;
}

export { toffecButtonVariants };
