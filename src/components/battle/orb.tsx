import { useState, useEffect } from 'react';
import { cva } from 'class-variance-authority';
import type { OrbComponentProps } from '~/types/components';
import { cn } from '~/lib/utils';
import { ORB_TYPE_CLASSES, ORB_GLOW_CLASSES } from '~/constants/ui';

const orbVariants = cva(
  'relative mx-1 h-6 w-6 rounded-full transition-all duration-200 sm:mx-1.5 sm:h-8 sm:w-8 md:mx-2 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16 cursor-pointer border-2 sm:border-3 hover:scale-110 active:scale-95',
  {
    variants: {
      type: {
        blue: ORB_TYPE_CLASSES.blue,
        green: ORB_TYPE_CLASSES.green,
        purple: ORB_TYPE_CLASSES.purple,
        yellow: ORB_TYPE_CLASSES.yellow,
        gray: ORB_TYPE_CLASSES.gray,
      },
      isSelected: {
        true: 'scale-110 animate-pulse ring-4 ring-white',
      },
      isHighlighted: {
        true: 'animate-ping',
      },
      isDisappearing: {
        true: 'scale-0 rotate-180 opacity-0',
      },
      isInvalidSwap: {
        true: 'shake ring-4 ring-red-500',
      },
      isNew: {
        true: 'fall-in',
      },
    },
    compoundVariants: [
      {
        isHighlighted: true,
        type: 'blue',
        class: ORB_GLOW_CLASSES.blue,
      },
      {
        isHighlighted: true,
        type: 'green',
        class: ORB_GLOW_CLASSES.green,
      },
      {
        isHighlighted: true,
        type: 'purple',
        class: ORB_GLOW_CLASSES.purple,
      },
      {
        isHighlighted: true,
        type: 'yellow',
        class: ORB_GLOW_CLASSES.yellow,
      },
      {
        isHighlighted: true,
        type: 'gray',
        class: ORB_GLOW_CLASSES.gray,
      },
    ],
  }
);

export function OrbComponent({ orb, isSelected, isInvalidSwap, isNew, onSelect }: OrbComponentProps) {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (orb.isHighlighted) {
      // Show particle explosion
      setShowParticles(true);

      // Start disappearing animation after a short delay
      const timer = setTimeout(() => {
        setIsDisappearing(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsDisappearing(false);
      setShowParticles(false);
    }
  }, [orb.isHighlighted]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        `orb-${orb.type}`,
        orbVariants({
          type: orb.type,
          isSelected,
          isHighlighted: orb.isHighlighted,
          isDisappearing,
          isInvalidSwap,
          isNew,
        })
      )}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {/* Shine effect */}
      <div className="absolute top-0.5 left-0.5 h-2 w-2 rounded-full bg-white/40 blur-sm" />

      {/* Pixel border effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
      />

      {/* Particle explosion effect */}
      {showParticles && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn('absolute h-2 w-2 animate-ping rounded-full', ORB_TYPE_CLASSES[orb.type])}
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                animationDelay: `${i * 50}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
