import { useRef, useState, useEffect, useCallback } from 'react';
import { getNavDirection, type NavDirection } from '~/constants/keyboard';

export interface MultiKeyState {
  dx: number;   // -1, 0, or 1
  dy: number;   // -1, 0, or 1
  facing: NavDirection;
}

/**
 * Tracks simultaneously-held directional keys (arrows/WASD) and resolves:
 * - dx/dy: grid offset combining all active directions (diagonal = ±1,±1)
 * - facing: which cardinal direction the sprite should face, using the
 *   "first key pressed" priority rule
 *
 * Call onDirectionKeyDown in your keydown handler and onDirectionKeyUp in your
 * keyup listener. The stateRef is updated synchronously so the keydown handler
 * can read dx/dy immediately.
 */
export function useMultiKeyDirection() {
  const activeRef = useRef<Set<NavDirection>>(new Set());
  const firstRef = useRef<NavDirection | null>(null);
  const stateRef = useRef<MultiKeyState>({ dx: 0, dy: 0, facing: 'down' });
  const [, tick] = useState(0);

  const recompute = useCallback(() => {
    const dirs = activeRef.current;
    let dx = 0;
    let dy = 0;
    // Accumulate movement from every active direction
    for (const d of dirs) {
      if (d === 'up') dy -= 1;
      if (d === 'down') dy += 1;
      if (d === 'left') dx -= 1;
      if (d === 'right') dx += 1;
    }
    // Clamp to -1 / 0 / +1 per axis
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    // Facing: first key pressed, or fall through to any active direction
    let facing: NavDirection = 'down';
    if (firstRef.current) {
      facing = firstRef.current;
    } else if (dirs.size > 0) {
      facing = [...dirs][0];
    } else {
      // keep last known facing from stateRef
      facing = stateRef.current.facing;
    }

    stateRef.current = { dx, dy, facing };
  }, []);

  function onDirectionKeyDown(key: string): NavDirection | null {
    const dir = getNavDirection(key);
    if (!dir) return null;

    // First key pressed wins the "first" slot
    if (activeRef.current.size === 0) {
      firstRef.current = dir;
    }
    activeRef.current.add(dir);
    recompute();
    tick((n) => n + 1);
    return dir;
  }

  function onDirectionKeyUp(key: string): NavDirection | null {
    const dir = getNavDirection(key);
    if (!dir) return null;

    activeRef.current.delete(dir);

    // If the removed key was the first-pressed, promote another
    if (firstRef.current === dir) {
      const remaining = [...activeRef.current];
      firstRef.current = remaining[0] ?? null;
    }
    if (activeRef.current.size === 0) {
      firstRef.current = null;
    }

    recompute();
    tick((n) => n + 1);
    return dir;
  }

  // Attach keyup listener at the window level
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      onDirectionKeyUp(e.key);
    };
    window.addEventListener('keyup', handler);
    return () => window.removeEventListener('keyup', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stateRef, onDirectionKeyDown };
}
