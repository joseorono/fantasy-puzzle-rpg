import { useRef, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PointerPoint } from '~/lib/pointer-movement';

export interface PointerDirectionState {
  /** True while the pointer is held down on the map. */
  active: boolean;
  /** Pointer position in window (client) pixels — only meaningful while `active`. */
  clientX: number;
  clientY: number;
}

export interface PointerDirectionHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

/** Converts a window coordinate to map pixels, or `null` if not measurable yet. */
export type ToMapPoint = (clientX: number, clientY: number) => PointerPoint | null;

/**
 * Tracks a held pointer over the map and reports where it is in **window pixels**.
 *
 * Like {@link useMultiKeyDirection}, state lives in a ref and never in React
 * state — the consumer is a requestAnimationFrame loop that reads it
 * synchronously, so re-rendering on every pointer move would be pure overhead.
 *
 * The position stays in screen space on purpose. The camera scrolls the map under
 * a stationary pointer, so a held pointer means "the spot under the cursor right
 * now", not the map tile that was under it when it was pressed. The movement loop
 * converts it to map pixels each frame.
 *
 * Spread the returned handlers onto the map viewport. Pointer capture keeps a drag
 * tracking after it leaves the viewport, and focus loss releases the hold so it
 * can't latch.
 */
export function usePointerDirection() {
  const stateRef = useRef<PointerDirectionState>({ active: false, clientX: 0, clientY: 0 });

  function track(event: ReactPointerEvent): void {
    stateRef.current = { active: true, clientX: event.clientX, clientY: event.clientY };
  }

  function release(): void {
    if (!stateRef.current.active) return;
    stateRef.current = { ...stateRef.current, active: false };
  }

  function onPointerDown(event: ReactPointerEvent): void {
    // Only the primary button (and any touch/pen contact) drives movement.
    if (event.button !== 0) return;

    // Keeps the drag alive once it leaves the viewport.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    // Suppresses text selection and the native image drag on the canvas.
    event.preventDefault();
    track(event);
  }

  function onPointerMove(event: ReactPointerEvent): void {
    if (!stateRef.current.active) return;
    track(event);
  }

  function onPointerUp(): void {
    release();
  }

  function onPointerCancel(): void {
    release();
  }

  // Releasing on focus loss prevents a held pointer from latching when the user
  // alt-tabs mid-drag, the same way held keys are released.
  useEffect(() => {
    const handleBlur = () => release();
    const handleVisibilityChange = () => {
      if (document.hidden) release();
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const pointerHandlers: PointerDirectionHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };

  return { stateRef, pointerHandlers, release };
}
