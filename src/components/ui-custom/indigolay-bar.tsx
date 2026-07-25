import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const indigolayBarVariants = cva('indigolay-bar', {
  variants: {
    variant: {
      orange: 'indigolay-bar--orange',
      green: 'indigolay-bar--green',
      'sky-blue': 'indigolay-bar--sky-blue',
      blue: 'indigolay-bar--blue',
      'blue-green': 'indigolay-bar--blue-green',
      pink: 'indigolay-bar--pink',
      purple: 'indigolay-bar--purple',
      red: 'indigolay-bar--red',
      yellow: 'indigolay-bar--yellow',
      slate: 'indigolay-bar--slate',
    },
    size: {
      xs: 'indigolay-bar--xs',
      sm: 'indigolay-bar--sm',
      default: 'indigolay-bar--default',
      lg: 'indigolay-bar--lg',
      xl: 'indigolay-bar--xl',
    },
  },
  defaultVariants: {
    variant: 'orange',
    size: 'default',
  },
});

interface IndigolayBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof indigolayBarVariants> {
  /** Fill percentage (0–100). Clamped, so callers can pass raw ratios safely. */
  percentage: number;
  /** Optional overlay (e.g. "129 / 403"), centred over the whole bar. */
  label?: React.ReactNode;
  /** Draws N notches across the fill. Omit for a smooth fill. */
  segments?: number;
  /** Rendered inside the fill, so it clips to the filled width — shimmer / pulse. */
  children?: React.ReactNode;
  /** Rendered over the whole bar regardless of fill — flashes, popups. */
  overlay?: React.ReactNode;
}

/**
 * Pixel-art progress bar built on the indigolay HUD art: the track is a 9-sliced
 * PNG (`border-image` with `fill`, so the bronze frame stays crisp while the
 * channel stretches) and the fill is a matching per-colour PNG stretched to the
 * fill box. Sizes are picked so the 24px-tall fill art downscales by a clean
 * integer ratio — uneven sampling is what makes its bands look ragged.
 *
 * The fill sits in the content box, which `border-width` insets on all sides, so
 * it lands inside the frame with no extra positioning.
 */
export function IndigolayBar({
  className,
  percentage,
  label,
  segments,
  size,
  variant,
  children,
  overlay,
  ...props
}: IndigolayBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(indigolayBarVariants({ variant, size, className }))}
      {...props}
    >
      <div className="indigolay-bar__fill" style={{ width: `${clamped}%` }}>
        {children}
      </div>
      {segments ? (
        <div
          className="indigolay-bar__segments"
          style={{ ['--ib-segments' as string]: segments }}
        />
      ) : null}
      {overlay ? <div className="indigolay-bar__overlay">{overlay}</div> : null}
      {label ? <div className="indigolay-bar__label pixel-font">{label}</div> : null}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { indigolayBarVariants };
