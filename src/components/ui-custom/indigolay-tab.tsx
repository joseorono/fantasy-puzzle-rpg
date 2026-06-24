import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const indigolayTabVariants = cva(
  'indigolay-tab inline-flex items-center justify-center border-none bg-transparent font-bold uppercase tracking-wide select-none outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      size: {
        sm: 'indigolay-tab--sm',
        default: 'indigolay-tab--default',
        lg: 'indigolay-tab--lg',
      },
      state: {
        inactive: 'indigolay-tab--inactive',
        active: 'indigolay-tab--active',
      },
      glow: {
        true: 'indigolay-tab--glow',
        false: 'indigolay-tab--no-glow',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'inactive',
      glow: true,
    },
  },
);

interface IndigolayTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof indigolayTabVariants> {
  isActive?: boolean;
}

export function IndigolayTab({ className, glow, isActive, size, state, type = 'button', ...props }: IndigolayTabProps) {
  const resolvedState = isActive === true ? 'active' : isActive === false ? 'inactive' : state;

  return <button type={type} className={cn(indigolayTabVariants({ glow, size, state: resolvedState, className }))} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { indigolayTabVariants };
