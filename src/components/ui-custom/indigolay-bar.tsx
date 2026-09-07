import { useEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

/** Kept in sync with `defaultVariants.variant` below, and used to resolve an omitted
 *  `variant` prop — the layer class is built by interpolation, so `undefined` there
 *  would yield `indigolay-bar__layer--undefined` and render no sprite. */
const DEFAULT_BAR_VARIANT = 'orange';

const indigolayBarVariants = cva('indigolay-bar indigolay-art', {
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
    variant: DEFAULT_BAR_VARIANT,
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
 * Pixel-art progress bar built on the indigolay HUD art: the track and the fill
 * are both 9-sliced PNGs (`border-image` with `fill`), so the bronze frame and
 * the fill's rounded caps stay crisp while only their flat middles stretch.
 * Sizes are picked so the 24px-tall fill art downscales by a clean integer ratio
 * — uneven sampling is what makes its bands look ragged.
 *
 * Colour changes crossfade. `border-image-source` is not interpolatable, so a
 * single layer could only hard-cut between sprites; instead the outgoing sprite
 * is held underneath while the incoming one fades in over it. A bar whose variant
 * never changes renders exactly one layer and pays nothing for this.
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
  // Resolved here as well as in cva: the layer class is built by interpolation, so
  // an omitted variant would otherwise yield `--undefined` and render no sprite.
  const activeVariant = variant ?? DEFAULT_BAR_VARIANT;

  // The variant the bar has settled on; `outgoing` is the sprite still fading out
  // beneath it. Kept in a ref because it must not itself trigger a render.
  const settledVariant = useRef(activeVariant);
  const [outgoing, setOutgoing] = useState<typeof activeVariant | null>(null);

  useEffect(() => {
    if (settledVariant.current === activeVariant) return;
    setOutgoing(settledVariant.current);
    settledVariant.current = activeVariant;
  }, [activeVariant]);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(indigolayBarVariants({ variant: activeVariant, size, className }))}
      {...props}
    >
      <div className="indigolay-bar__fill" style={{ width: `${clamped}%` }}>
        {outgoing ? <div className={cn('indigolay-bar__layer indigolay-art', `indigolay-bar__layer--${outgoing}`)} /> : null}
        <div
          // Remounts on every colour change so the fade-in animation restarts.
          key={activeVariant}
          className={cn(
            'indigolay-bar__layer indigolay-art',
            `indigolay-bar__layer--${activeVariant}`,
            outgoing && 'indigolay-bar__layer--in',
          )}
          onAnimationEnd={() => setOutgoing(null)}
        />
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
