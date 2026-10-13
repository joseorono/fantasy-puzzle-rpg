import { useState } from 'react';
import { cn } from '~/lib/utils';
import { BATTLE_AMBIENT_PARTICLE_COUNT } from '~/constants/battle';

interface FloatingParticlesProps {
  /** Number of motes to render (0 or less renders nothing). */
  count?: number;
  className?: string;
}

/**
 * Ambient field of warm dust motes drifting slowly upward, used as a backdrop
 * layer on the battle screen. Styling and keyframes live in
 * `~/styles/floating-particles.css`.
 *
 * The layer is `absolute`, so it fills the nearest positioned ancestor —
 * `#game-screen` — and stays inside the window frame rather than spilling over
 * the decorative border the way a `fixed` layer would.
 *
 * Placements are randomised once on mount rather than per render. Computing
 * `Math.random()` inline in JSX re-scatters every mote on every re-render, which
 * also restarts each element's CSS animation — so the layer visibly reseeds
 * itself instead of drifting, and does so as often as the parent renders.
 *
 * `count` is fixed per mounted instance, so a lazy initializer is sufficient.
 * Mirrors the approach in {@link ./sparkle-layer.tsx}.
 */
export function FloatingParticles({ count = BATTLE_AMBIENT_PARTICLE_COUNT, className }: FloatingParticlesProps) {
  const [motes] = useState(() =>
    Array.from({ length: Math.max(0, count) }, () => {
      const size = 2 + Math.random() * 4;
      const duration = 9 + Math.random() * 9;
      return {
        left: Math.random() * 100,
        top: Math.random() * 100,
        size,
        // Larger motes read as nearer, so let them sit brighter.
        peak: 0.4 + (size / 6) * 0.35,
        duration,
        // A negative delay starts each mote partway through its cycle, so the field
        // is already populated on mount instead of fading up from nothing together.
        delay: -Math.random() * duration,
        driftX: -30 + Math.random() * 60,
        driftY: -(60 + Math.random() * 80),
      };
    }),
  );

  if (motes.length === 0) return null;

  return (
    <div className={cn('floating-particles', className)}>
      {motes.map((mote, i) => (
        <div
          key={i}
          className="floating-mote"
          style={
            {
              left: `${mote.left}%`,
              top: `${mote.top}%`,
              '--mote-size': `${mote.size}px`,
              '--mote-glow': `${mote.size * 2}px`,
              '--mote-peak': mote.peak,
              '--mote-duration': `${mote.duration}s`,
              '--mote-delay': `${mote.delay}s`,
              '--mote-drift-x': `${mote.driftX}px`,
              '--mote-drift-y': `${mote.driftY}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
