import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { auxSleepFor } from '~/lib/utils';
import { isReducedMotion } from '~/lib/reduced-motion';
import { ANIMATION_CONFIG, type GlobalAnimationType } from '~/constants/animation-system';
import { soundService } from '~/services/sound-service';
import { getAnimationDuration, applyAnimation, removeAnimation } from '~/lib/animation-strategies';
import { pickTransition } from '~/lib/view-transitions';

// Re-export for convenience
export type { GlobalAnimationType };

type OnEndCallback = () => void;

interface GlobalAnimationContextValue {
  trigger: (type: GlobalAnimationType, onEnd?: OnEndCallback) => Promise<void>;
  triggerSequence: (sequence: GlobalAnimationType[], onEnd?: OnEndCallback) => Promise<void>;
  /** Triggers a random member of `pool`, avoiding whichever member the previous pool draw played. */
  triggerFromPool: (pool: readonly GlobalAnimationType[], onEnd?: OnEndCallback) => Promise<void>;
}

const GlobalAnimationContext = createContext<GlobalAnimationContextValue | null>(null);

export function GlobalAnimationProvider({ children }: { children: React.ReactNode }) {
  const lastPoolPickRef = useRef<GlobalAnimationType | null>(null);
  const [animation, setAnimation] = useState<GlobalAnimationType | null>(null);

  const trigger = useCallback(async (type: GlobalAnimationType, onEnd?: OnEndCallback) => {
    // Sound is not motion: a paired SFX plays whether or not the visuals are skipped below.
    const sound = ANIMATION_CONFIG[type].sound;
    if (sound) soundService.playSound(sound.name, sound.volume);

    // Reduced motion skips the flourish outright: the CSS override ends the animation in ~1ms, so
    // waiting out its full duration would leave the player staring at a still screen for a beat.
    if (isReducedMotion()) {
      onEnd?.();
      return;
    }

    // The timer owns the whole lifecycle: the class stays on until it fires, so a cover transition
    // holds until `onEnd` has navigated underneath it, and the clear lands in the same commit.
    setAnimation(type);
    await auxSleepFor(getAnimationDuration(type));
    onEnd?.();
    setAnimation(null);
  }, []);

  const triggerSequence = useCallback(
    async (sequence: GlobalAnimationType[], onEnd?: OnEndCallback) => {
      for (const type of sequence) {
        await trigger(type);
      }
      onEnd?.();
    },
    [trigger],
  );

  const triggerFromPool = useCallback(
    async (pool: readonly GlobalAnimationType[], onEnd?: OnEndCallback) => {
      const type = pickTransition(pool, lastPoolPickRef.current);
      lastPoolPickRef.current = type;
      await trigger(type, onEnd);
    },
    [trigger],
  );

  return (
    <GlobalAnimationContext.Provider value={{ trigger, triggerSequence, triggerFromPool }}>
      {children}
      <GlobalAnimationsOverlay type={animation} />
    </GlobalAnimationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalAnimation() {
  const ctx = useContext(GlobalAnimationContext);
  if (!ctx) throw new Error('useGlobalAnimation must be used within GlobalAnimationProvider');
  return ctx;
}

// ------------------------------------------------------

function GlobalAnimationsOverlay({ type }: { type: GlobalAnimationType | null }) {
  const ref = useRef<HTMLDivElement>(null);

  // Cleanup runs on every type change and on unmount, so no class can outlive its trigger.
  useEffect(() => {
    if (!type) return;
    const el = ref.current;
    applyAnimation(type, el);
    return () => removeAnimation(type, el);
  }, [type]);

  return <div ref={ref} className="global-animations-overlay" />;
}
