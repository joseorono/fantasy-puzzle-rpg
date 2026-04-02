import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const toffecCloseButtonVariants = cva(
  'toffec-close-btn select-none outline-none transition-transform duration-100',
  {
    variants: {
      variant: {
        medieval1: 'toffec-close-btn--medieval1',
        medieval2: 'toffec-close-btn--medieval2',
        medieval3: 'toffec-close-btn--medieval3',
        medieval4: 'toffec-close-btn--medieval4',
        medieval5: 'toffec-close-btn--medieval5',
        medieval6: 'toffec-close-btn--medieval6',
        fairy1: 'toffec-close-btn--fairy1',
        fairy2: 'toffec-close-btn--fairy2',
        fairy3: 'toffec-close-btn--fairy3',
      },
      size: {
        sm: 'w-6 h-6',
        default: 'w-8 h-8',
        lg: 'w-10 h-10',
        xl: 'w-12 h-12',
      },
      hasBg: {
        true: 'toffec-close-btn--has-bg',
        false: '',
      },
    },
    compoundVariants: [
      { hasBg: false, size: 'sm', className: '[--cb-x-thickness:2px] [--cb-x-length:75%]' },
      { hasBg: false, size: 'default', className: '[--cb-x-thickness:3px] [--cb-x-length:75%]' },
      { hasBg: false, size: 'lg', className: '[--cb-x-thickness:3px] [--cb-x-length:75%]' },
      { hasBg: false, size: 'xl', className: '[--cb-x-thickness:4px] [--cb-x-length:75%]' },
      { hasBg: true, size: 'sm', className: '[--cb-x-thickness:2px] [--cb-x-length:50%]' },
      { hasBg: true, size: 'default', className: '[--cb-x-thickness:3px] [--cb-x-length:50%]' },
      { hasBg: true, size: 'lg', className: '[--cb-x-thickness:3px] [--cb-x-length:50%]' },
      { hasBg: true, size: 'xl', className: '[--cb-x-thickness:4px] [--cb-x-length:55%]' },
    ],
    defaultVariants: {
      variant: 'medieval1',
      size: 'default',
      hasBg: true,
    },
  },
);

const OUTLINED_VARIANTS = new Set(['medieval5', 'fairy1']);

interface ToffecCloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toffecCloseButtonVariants> {}

export function ToffecCloseButton({
  className,
  variant,
  size,
  hasBg,
  ...props
}: ToffecCloseButtonProps) {
  const isOutlined = OUTLINED_VARIANTS.has(variant ?? 'medieval1');

  return (
    <button
      type="button"
      aria-label="Close"
      className={cn(toffecCloseButtonVariants({ variant, size, hasBg, className }))}
      {...props}
    >
      <span
        className={cn('toffec-close-btn__x', isOutlined && 'toffec-close-btn--outlined')}
      />
    </button>
  );
}

export { toffecCloseButtonVariants };
