import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';
import { auxSleepFor } from '~/lib/utils';
import { type GlobalAnimationType } from '~/constants/animation-system';
import { getAnimationDuration, applyAnimation, removeAnimation } from '~/lib/animation-strategies';

// Re-export for convenience
export type { GlobalAnimationType };

type OnEndCallback = () => void;

interface GlobalAnimationContextValue {
  trigger: (
    type: GlobalAnimationType,
    onEnd?: OnEndCallback
  ) => Promise<void>;
  triggerSequence: (
    sequence: GlobalAnimationType[],
    onEnd?: OnEndCallback
  ) => Promise<void>;
}

const GlobalAnimationContext = createContext<GlobalAnimationContextValue | null>(null);

export function GlobalAnimationProvider({ children }: { children: React.ReactNode }) {
  const resolveRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<OnEndCallback | null>(null);
  const [animation, setAnimation] = useState<GlobalAnimationType | null>(null);

  const trigger = useCallback(
    async (type: GlobalAnimationType, onEnd?: OnEndCallback) => {
      callbackRef.current = onEnd || null;
      setAnimation(type);
      // Wait for the animation duration
      await auxSleepFor(getAnimationDuration(type));
      // Execute callback and resolve
      callbackRef.current?.();
      resolveRef.current?.();
      callbackRef.current = null;
      resolveRef.current = null;
    },
    []
  );

  const triggerSequence = useCallback(
    async (sequence: GlobalAnimationType[], onEnd?: OnEndCallback) => {
      for (const type of sequence) {
        await trigger(type);
      }
      onEnd?.();
    },
    [trigger]
  );

  const handleAnimationEnd = useCallback(() => {
    setAnimation(null);
    // Callbacks are now handled by the duration-based timing in trigger()
  }, []);

  return (
    <GlobalAnimationContext.Provider value={{ trigger, triggerSequence }}>
      {children}
      <GlobalAnimationsOverlay type={animation} onEnd={handleAnimationEnd} />
    </GlobalAnimationContext.Provider>
  );
}

export function useGlobalAnimation() {
  const ctx = useContext(GlobalAnimationContext);
  if (!ctx) throw new Error('useGlobalAnimation must be used within GlobalAnimationProvider');
  return ctx;
}

// ------------------------------------------------------

function GlobalAnimationsOverlay({
  type,
  onEnd,
}: {
  type: GlobalAnimationType | null;
  onEnd: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!type) return;

    // Apply animation using strategy
    applyAnimation(type, el);

    function handleEnd() {
      if (type) removeAnimation(type, el);
      if (el) el.className = 'global-animations-overlay';
      onEnd();
    }

    // Listen for animationend on both overlay and game-screen
    const gameScreen = document.getElementById('game-screen');
    const animationTargets = [el, gameScreen].filter(Boolean) as HTMLElement[];

    animationTargets.forEach((target) => {
      target.addEventListener('animationend', handleEnd);
    });

    return () => {
      animationTargets.forEach((target) => {
        target.removeEventListener('animationend', handleEnd);
      });
    };
  }, [type, onEnd]);

  return <div ref={ref} className="global-animations-overlay" />;
}