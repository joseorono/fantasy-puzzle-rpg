import { useState } from 'react';
import { cn } from '~/lib/utils';
import { BATTLE_AMBIENT_PARTICLE_COUNT } from '~/constants/battle';

interface FloatingParticlesProps {
  /** Number of motes to render (0 or less renders nothing). */
  count?: number;
  className?: string;
}

/**
 * Ambient field of slowly pulsing motes, used as a full-screen backdrop layer
 * behind the battle screen.
 *
 * Placements are randomised once on mount rather than per render. Computing
 * `Math.random()` inline in JSX re-scatters every mote on every re-render, which
 * also restarts each element's CSS animation — so the layer visibly reseeds
 * itself instead of drifting, and does so as often as the parent renders.
 *
 * `count` is fixed per mounted instance, so a lazy initializer is sufficient.
 * Mirrors the approach in {@link ../effects/sparkle-layer.tsx}.
 */
export function FloatingParticles({ count = BATTLE_AMBIENT_PARTICLE_COUNT, className }: FloatingParticlesProps) {
  const [particles] = useState(() =>
    Array.from({ length: Math.max(0, count) }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })),
  );

  if (particles.length === 0) return null;

  return (
    <div className={cn('pointer-events-none fixed inset-0 overflow-hidden', className)}>
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 animate-pulse rounded-full bg-white opacity-30"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
