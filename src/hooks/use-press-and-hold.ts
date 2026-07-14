import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { STAT_BUTTON_HOLD } from '~/constants/ui';

interface PressAndHoldOptions {
  /** Wait before the first auto-repeat fires (a quick click never triggers the train). */
  initialDelayMs?: number;
  /** Fastest repeat interval the acceleration can reach. */
  minIntervalMs?: number;
  /** Each repeat multiplies the wait by this (< 1 accelerates). */
  accelerationFactor?: number;
}

export interface PressAndHoldHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

/**
 * Auto-repeat an action while a pointer is held on an element, accelerating the longer it's held.
 *
 * The action is deliberately **not** fired on press — leave the single step to the element's own
 * `onClick`, so a plain click (or keyboard activation, which never emits pointer events) does
 * exactly one and there's no double-count. This hook only drives the *repeat train*: after
 * `initialDelayMs` it calls `action` on an interval that shrinks by `accelerationFactor` toward
 * `minIntervalMs`. Return `false` from `action` to stop early (e.g. nothing left to spend).
 *
 * Defaults come from {@link STAT_BUTTON_HOLD}. Spread the returned handlers onto the element.
 *
 * @param action Called on each repeat; return `false` to stop the train.
 * @param options Timing overrides.
 */
export function usePressAndHold(
  action: () => boolean | void,
  options: PressAndHoldOptions = {},
): PressAndHoldHandlers {
  const {
    initialDelayMs = STAT_BUTTON_HOLD.initialDelayMs,
    minIntervalMs = STAT_BUTTON_HOLD.minIntervalMs,
    accelerationFactor = STAT_BUTTON_HOLD.accelerationFactor,
  } = options;

  // Read the latest action inside timers without re-arming anything.
  const actionRef = useRef(action);
  actionRef.current = action;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(initialDelayMs);

  function clear() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleNext() {
    timerRef.current = setTimeout(() => {
      if (actionRef.current() === false) {
        clear();
        return;
      }
      intervalRef.current = Math.max(minIntervalMs, intervalRef.current * accelerationFactor);
      scheduleNext();
    }, intervalRef.current);
  }

  function start(event: ReactPointerEvent) {
    // Only the primary button/touch/pen starts a hold.
    if (event.button !== 0) return;
    clear();
    intervalRef.current = initialDelayMs;
    scheduleNext();
  }

  // Stop any running train if the component unmounts mid-hold.
  useEffect(() => clear, []);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
