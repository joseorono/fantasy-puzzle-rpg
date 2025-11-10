import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastDamageAtom } from '~/stores/battle-atoms';
import { cn } from '~/lib/utils';
import { DamageDisplay } from '~/components/ui/8bit/damage-display';
import type { DamageNumberProps } from '~/types/components';

export function DamageNumber({ target }: DamageNumberProps) {
  const lastDamage = useAtomValue(lastDamageAtom);
  const [visible, setVisible] = useState(false);
  const [displayDamage, setDisplayDamage] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (lastDamage && lastDamage.target === target) {
      setDisplayDamage(lastDamage.amount);
      setVisible(true);
      setAnimationKey((prev) => prev + 1); // Force new animation

      const timer = setTimeout(() => {
        setVisible(false);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [lastDamage, target]);

  if (!visible) return null;

  return (
    <>
      {/* Main damage number with 8bitcn styling */}
      <div
        key={animationKey}
        className="damage-number pointer-events-none absolute top-1/4 left-1/2 z-20 -translate-x-1/2"
        style={{
          animation: 'damage-float 1.2s ease-out forwards',
        }}
      >
        <DamageDisplay
          amount={displayDamage}
          type={displayDamage > 20 ? 'critical' : 'damage'}
          className="text-4xl md:text-5xl"
        />
      </div>

      {/* Impact flash effect */}
      <div
        key={`flash-${animationKey}`}
        className={cn(
          'pointer-events-none absolute inset-0 z-10',
          target === 'enemy' ? 'bg-red-500/30' : 'bg-orange-500/30',
        )}
        style={{
          animation: 'flash-fade 0.3s ease-out forwards',
        }}
      />

      {/* Additional smaller damage numbers for impact */}
      {displayDamage > 15 && (
        <>
          <div
            key={`extra1-${animationKey}`}
            className={cn(
              'pointer-events-none absolute top-1/3 left-1/3 z-15',
              'pixel-font-alt text-3xl font-bold md:text-4xl',
              target === 'enemy' ? 'text-red-400' : 'text-orange-400',
            )}
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.6)',
              animation: 'damage-float 1s ease-out forwards',
              animationDelay: '0.1s',
            }}
          >
            -{Math.floor(displayDamage / 3)}
          </div>
          <div
            key={`extra2-${animationKey}`}
            className={cn(
              'pointer-events-none absolute top-1/3 right-1/3 z-15',
              'pixel-font-alt text-3xl font-bold md:text-4xl',
              target === 'enemy' ? 'text-red-400' : 'text-orange-400',
            )}
            style={{
              textShadow: '2px 2px 0px rgba(0,0,0,0.6)',
              animation: 'damage-float 1s ease-out forwards',
              animationDelay: '0.15s',
            }}
          >
            -{Math.floor(displayDamage / 4)}
          </div>
        </>
      )}
    </>
  );
}
