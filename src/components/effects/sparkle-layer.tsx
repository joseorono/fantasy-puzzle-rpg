import { useState } from 'react';
import { cn } from '~/lib/utils';

interface SparkleLayerProps {
  /** Number of drifting sparkles to render (0 or less renders nothing). */
  count: number;
  /** Color theme of the sparkles. Defaults to gold. */
  variant?: 'gold' | 'red';
  /** Override the layer's stacking order. Falls back to the CSS default when omitted. */
  zIndex?: number;
  className?: string;
}

/**
 * A drifting "sprinkles" layer for celebratory (or somber) overlays. Renders an
 * absolutely-positioned field of randomly-placed sparkles that float upward and
 * fade. Shared by the overlay container, the battle victory/defeat modal, etc.
 *
 * Position the parent `relative` to scope the sparkles to it.
 */
export function SparkleLayer({ count, variant = 'gold', zIndex, className }: SparkleLayerProps) {
  // Generate the random placements once on mount so re-renders of the parent
  // (e.g. animating reward counters) don't re-scatter the sparkles each frame.
  // `count` is static per mounted instance, so a lazy initializer is sufficient.
  const [sparkles] = useState(() =>
    Array.from({ length: Math.max(0, count) }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    })),
  );

  if (count <= 0) return null;

  return (
    <div
      className={cn('gom-sparkles', variant === 'red' && 'gom-sparkles--red', className)}
      style={zIndex === undefined ? undefined : { zIndex }}
    >
      {sparkles.map((sparkle, i) => (
        <div
          key={i}
          className="gom-sparkle"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
