import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
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
  onClickCapture: (event: ReactMouseEvent) => void;
}

/**
 * Auto-repeat an action while a pointer is held on an element, accelerating the longer it's held.
 *
 * The action is deliberately **not** fired on press — leave the single step to the element's own
 * `onClick`, so a plain click (or keyboard activation, which never emits pointer events) does
 * exactly one. This hook only drives the *repeat train*: after `initialDelayMs` it calls `action`
 * on an interval that shrinks by `accelerationFactor` toward `minIntervalMs`. Return `false` from
 * `action` to stop early (e.g. nothing left to spend).
 *
 * A held press ends with the browser firing a trailing `click`; if the train ran, `onClickCapture`
 * swallows that click so a hold contributes only its train (no extra `onClick` step on release).
 * A tap fires no train, so its click passes through as the single step. Spread ALL returned
 * handlers onto the element.
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
  // True once the repeat train has fired ≥1 tick this hold, so the trailing release-`click` can be
  // swallowed instead of adding a spurious extra step on top of the train.
  const didRepeatRef = useRef(false);

  function clear() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleNext() {
    timerRef.current = setTimeout(() => {
      didRepeatRef.current = true;
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
    didRepeatRef.current = false;
    intervalRef.current = initialDelayMs;
    scheduleNext();
  }

  // Swallow the release-`click` after a hold that fired at least one repeat (capture phase runs
  // before the element's own `onClick`, so stopping propagation there suppresses it). A tap fires
  // no repeat, so its click passes through untouched as the single step.
  function suppressPostHoldClick(event: ReactMouseEvent) {
    if (!didRepeatRef.current) return;
    event.stopPropagation();
    didRepeatRef.current = false;
  }

  // Stop any running train if the component unmounts mid-hold.
  useEffect(() => clear, []);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClickCapture: suppressPostHoldClick,
  };
}
