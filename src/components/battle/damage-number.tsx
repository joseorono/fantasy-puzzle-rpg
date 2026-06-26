import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastDamageAtom } from '~/stores/battle-atoms';
import { cn } from '~/lib/utils';
import { DamageDisplay } from '~/components/ui-custom/damage-display';
import type { DamageNumberProps } from '~/types/components';

export function DamageNumber({ target }: DamageNumberProps) {
  const lastDamage = useAtomValue(lastDamageAtom);
  const [visible, setVisible] = useState(false);
  const [displayDamage, setDisplayDamage] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Skip fully-blocked hits (amount 0) — the Guard bar's "BLOCK!" popup is the feedback there.
    if (lastDamage && lastDamage.target === target && lastDamage.amount > 0) {
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
        <DamageDisplay amount={displayDamage} type="damage" className="text-4xl md:text-5xl" />
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
    </>
  );
}
