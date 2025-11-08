import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from 'react';

export type GlobalAnimationType = 'screen-shake' | 'view-transition' | null;

type OnEndCallback = () => void;

interface GlobalAnimationContextValue {
  trigger: (
    type: Exclude<GlobalAnimationType, null>,
    onEnd?: OnEndCallback
  ) => Promise<void>;
  triggerSequence: (
    sequence: Exclude<GlobalAnimationType, null>[],
    onEnd?: OnEndCallback
  ) => Promise<void>;
}

const GlobalAnimationContext = createContext<GlobalAnimationContextValue | null>(null);

export function GlobalAnimationProvider({ children }: { children: React.ReactNode }) {
  const resolveRef = useRef<(() => void) | null>(null);
  const callbackRef = useRef<OnEndCallback | null>(null);
  const [animation, setAnimation] = useState<GlobalAnimationType>(null);

  const trigger = useCallback(
    async (type: Exclude<GlobalAnimationType, null>, onEnd?: OnEndCallback) => {
      return new Promise<void>((resolve) => {
        callbackRef.current = onEnd || null;
        resolveRef.current = resolve;
        setAnimation(type);
      });
    },
    []
  );

  const triggerSequence = useCallback(
    async (sequence: Exclude<GlobalAnimationType, null>[], onEnd?: OnEndCallback) => {
      for (const type of sequence) {
        await trigger(type);
      }
      onEnd?.();
    },
    [trigger]
  );

  const handleAnimationEnd = useCallback(() => {
    setAnimation(null);
    callbackRef.current?.();
    resolveRef.current?.();
    callbackRef.current = null;
    resolveRef.current = null;
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
  type: GlobalAnimationType;
  onEnd: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (!type) return;

    function handleEnd() {
      el.className = 'global-animations-overlay';
      onEnd();
    }

    el.addEventListener('animationend', handleEnd);
    el.classList.add(`anim-${type}`);
    return () => {
      el.removeEventListener('animationend', handleEnd);
    };
  }, [type, onEnd]);

  return <div ref={ref} className="global-animations-overlay" />;
}