import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const toffecSquareButtonVariants = cva(
  'toffec-square-btn select-none outline-none transition-transform duration-100',
  {
    variants: {
      variant: {
        medieval1: 'toffec-square-btn--medieval1',
        medieval2: 'toffec-square-btn--medieval2',
        medieval3: 'toffec-square-btn--medieval3',
        medieval4: 'toffec-square-btn--medieval4',
        medieval5: 'toffec-square-btn--medieval5',
        medieval6: 'toffec-square-btn--medieval6',
        fairy1: 'toffec-square-btn--fairy1',
        fairy2: 'toffec-square-btn--fairy2',
        fairy3: 'toffec-square-btn--fairy3',
      },
      size: {
        sm: 'w-6 h-6',
        default: 'w-8 h-8',
        lg: 'w-10 h-10',
        xl: 'w-12 h-12',
      },
      hasBg: {
        true: 'toffec-square-btn--has-bg',
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

/** Glyph drawn from 1–2 CSS bars (colored by the variant's `--cb-x-color`). */
export type ToffecSquareIcon = 'close' | 'plus' | 'minus';

const DEFAULT_ARIA_LABEL: Record<ToffecSquareIcon, string> = {
  close: 'Close',
  plus: 'Increase',
  minus: 'Decrease',
};

interface ToffecSquareButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toffecSquareButtonVariants> {
  /** Which glyph to draw. Ignored when `children` are supplied. Defaults to `'close'`. */
  icon?: ToffecSquareIcon;
}

/**
 * Generic pixel-art square button: a colored, corner-clipped square (per
 * `variant`) with a glyph drawn from CSS bars. `icon` selects the glyph
 * (`close` = ✕, `plus` = +, `minus` = −); pass `children` instead for custom
 * content. The former `ToffecCloseButton` is this with `icon="close"`.
 */
export function ToffecSquareButton({
  className,
  variant,
  size,
  hasBg,
  icon = 'close',
  children,
  'aria-label': ariaLabel,
  ...props
}: ToffecSquareButtonProps) {
  const isOutlined = OUTLINED_VARIANTS.has(variant ?? 'medieval1');

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? DEFAULT_ARIA_LABEL[icon]}
      className={cn(toffecSquareButtonVariants({ variant, size, hasBg, className }))}
      {...props}
    >
      {children ?? (
        <span
          className={cn(
            'toffec-square-btn__glyph',
            `toffec-square-btn__glyph--${icon}`,
            isOutlined && 'toffec-square-btn__glyph--outlined',
          )}
        />
      )}
    </button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { toffecSquareButtonVariants };
