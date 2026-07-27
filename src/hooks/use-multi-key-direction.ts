import { useRef, useEffect } from 'react';
import { getNavDirection, isRunModifier, type NavDirection } from '~/constants/keyboard';

export interface MultiKeyState {
  /** -1, 0 or 1 — horizontal intent from all held keys. */
  dx: number;
  /** -1, 0 or 1 — vertical intent from all held keys. */
  dy: number;
  /** Cardinal direction the sprite should face, by first-key-pressed priority. */
  facing: NavDirection;
  /** True while a run modifier is held. */
  running: boolean;
}

/**
 * Tracks simultaneously-held directional keys plus the run modifier.
 *
 * State lives entirely in a ref and is never mirrored into React state: the
 * consumer is a requestAnimationFrame loop that reads it synchronously, so
 * re-rendering on every keypress would be pure overhead.
 *
 * Call `onDirectionKeyDown` from your keydown handler; keyup, the run modifier,
 * and focus loss are handled here at the window level.
 */
export function useMultiKeyDirection() {
  const activeRef = useRef<Set<NavDirection>>(new Set());
  const firstRef = useRef<NavDirection | null>(null);
  const stateRef = useRef<MultiKeyState>({ dx: 0, dy: 0, facing: 'down', running: false });

  function recompute() {
    const directions = activeRef.current;
    let dx = 0;
    let dy = 0;

    // Accumulate every active direction, then clamp — opposite keys cancel out.
    for (const direction of directions) {
      if (direction === 'up') dy -= 1;
      if (direction === 'down') dy += 1;
      if (direction === 'left') dx -= 1;
      if (direction === 'right') dx += 1;
    }
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    let facing: NavDirection = stateRef.current.facing;
    if (firstRef.current) {
      facing = firstRef.current;
    } else if (directions.size > 0) {
      facing = [...directions][0];
    }

    stateRef.current = { ...stateRef.current, dx, dy, facing };
  }

  function onDirectionKeyDown(key: string): NavDirection | null {
    const direction = getNavDirection(key);
    if (!direction) return null;

    // The first key pressed wins the facing slot for the whole gesture.
    if (activeRef.current.size === 0) {
      firstRef.current = direction;
    }
    activeRef.current.add(direction);
    recompute();
    return direction;
  }

  function onDirectionKeyUp(key: string): void {
    const direction = getNavDirection(key);
    if (!direction) return;

    activeRef.current.delete(direction);

    // Promote another held key into the facing slot if the first one was released.
    if (firstRef.current === direction) {
      firstRef.current = [...activeRef.current][0] ?? null;
    }
    recompute();
  }

  /** Drops all held input. Used on focus loss so keys can't stay latched. */
  function releaseAll(): void {
    activeRef.current.clear();
    firstRef.current = null;
    stateRef.current = { ...stateRef.current, dx: 0, dy: 0, running: false };
  }

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        stateRef.current = { ...stateRef.current, running: false };
        return;
      }
      onDirectionKeyUp(event.key);
    };

    // Owned here rather than in the map's keydown handler so holding Shift
    // *while already walking* starts a run immediately, instead of waiting for
    // the OS to repeat a direction key.
    const handleKeyDown = (event: KeyboardEvent) => {
      const running = isRunModifier(event);
      if (running !== stateRef.current.running) {
        stateRef.current = { ...stateRef.current, running };
      }
    };

    const handleBlur = () => releaseAll();
    const handleVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stateRef, onDirectionKeyDown };
}
