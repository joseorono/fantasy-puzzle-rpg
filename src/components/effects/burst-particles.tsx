import { useState, type CSSProperties } from 'react';
import { cn } from '~/lib/utils';

interface BurstParticlesProps {
  /** Number of particles to spray (0 or less renders nothing). */
  count: number;
  /** Each particle takes one of these, at random. */
  colors: readonly string[];
  className?: string;
}

/**
 * A one-shot radial spray of square pixel bits that fly out from the centre, arc down and fade.
 * Position the parent `relative`; the burst originates at its centre.
 *
 * Placements are rolled once on mount, mirroring `SparkleLayer`, so parent re-renders don't
 * re-scatter them mid-flight.
 */
export function BurstParticles({ count, colors, className }: BurstParticlesProps) {
  const [particles] = useState(() =>
    Array.from({ length: Math.max(0, count) }, () => {
      // Mostly upward: a fountain out of the chest rather than an even ring.
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const distance = 60 + Math.random() * 110;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        fall: 30 + Math.random() * 50,
        size: Math.round(3 + Math.random() * 4),
        delay: Math.random() * 90,
        duration: 750 + Math.random() * 450,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }),
  );

  if (count <= 0) return null;

  return (
    <div className={cn('burst-particles', className)}>
      {particles.map((particle, i) => (
        <span
          key={i}
          className="burst-particle"
          style={
            {
              '--burst-dx': `${particle.dx}px`,
              '--burst-dy': `${particle.dy}px`,
              '--burst-fall': `${particle.fall}px`,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              animationDelay: `${particle.delay}ms`,
              animationDuration: `${particle.duration}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
