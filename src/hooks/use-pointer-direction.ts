import { useRef, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PointerPoint } from '~/lib/pointer-movement';

export interface PointerDirectionState {
  /** True while the pointer is held down on the map. */
  active: boolean;
  /** Pointer position in map pixels — only meaningful while `active`. */
  x: number;
  y: number;
}

export interface PointerDirectionHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

/** Converts a viewport coordinate to map pixels, or `null` if not measurable yet. */
export type ToMapPoint = (clientX: number, clientY: number) => PointerPoint | null;

/**
 * Tracks a held pointer over the map and reports where it is in **map pixels**.
 *
 * Like {@link useMultiKeyDirection}, state lives in a ref and never in React
 * state — the consumer is a requestAnimationFrame loop that reads it
 * synchronously, so re-rendering on every pointer move would be pure overhead.
 *
 * The conversion to map space happens on each pointer event rather than per
 * frame. That keeps a layout-reading `getBoundingClientRect()` out of the
 * animation loop, and it makes the stored target robust: a map-space point
 * stays correct even if the window is resized mid-hold.
 *
 * Spread the returned handlers onto the canvas. Pointer capture keeps a drag
 * tracking after it leaves the canvas, and focus loss releases the hold so it
 * can't latch.
 *
 * @param toMapPoint Converts client coordinates to map pixels.
 */
export function usePointerDirection(toMapPoint: ToMapPoint) {
  const stateRef = useRef<PointerDirectionState>({ active: false, x: 0, y: 0 });

  // Read the latest converter without re-creating the handlers.
  const toMapPointRef = useRef(toMapPoint);
  toMapPointRef.current = toMapPoint;

  function track(event: ReactPointerEvent): void {
    const point = toMapPointRef.current(event.clientX, event.clientY);
    if (!point) return;
    stateRef.current = { active: true, x: point.x, y: point.y };
  }

  function release(): void {
    if (!stateRef.current.active) return;
    stateRef.current = { ...stateRef.current, active: false };
  }

  function onPointerDown(event: ReactPointerEvent): void {
    // Only the primary button (and any touch/pen contact) drives movement.
    if (event.button !== 0) return;

    // Keeps the drag alive once it leaves the canvas.
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

  return { stateRef, pointerHandlers };
}
