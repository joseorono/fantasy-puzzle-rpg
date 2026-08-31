import { useEffect, useRef } from 'react';

interface WindowKeyDownOptions {
  /**
   * Register in the capture phase, ahead of every bubble-phase listener (which is what every
   * other caller of this hook uses). Combine with `event.stopImmediatePropagation()` in the
   * handler to claim a key outright — the only way for a transient surface to take priority
   * over the handlers already mounted beneath it without editing any of them.
   *
   * Claim narrowly: return early for keys you aren't claiming so they still reach everyone else.
   */
  capture?: boolean;
}

/**
 * Subscribes a handler to the window `keydown` event for the lifetime of the
 * component, replacing the repeated
 * `useEffect(() => { window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [...])`
 * boilerplate scattered across keyboard-driven views.
 *
 * The latest `handler` is always invoked via a ref, so callers can pass an inline
 * closure over current props/state without managing a dependency array or worrying
 * about stale values — the listener itself is only bound once.
 *
 * @param handler Called with the `KeyboardEvent` on every keydown.
 * @param enabled When `false`, no listener is attached (defaults to `true`).
 * @param options See {@link WindowKeyDownOptions.capture}.
 */
export function useWindowKeyDown(
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true,
  options?: WindowKeyDownOptions,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const capture = options?.capture ?? false;

  useEffect(() => {
    if (!enabled) return;
    function listener(event: KeyboardEvent) {
      handlerRef.current(event);
    }
    // `capture` must be passed to both calls — a capturing listener is not removed by a
    // removeEventListener that omits it.
    window.addEventListener('keydown', listener, capture);
    return () => window.removeEventListener('keydown', listener, capture);
  }, [enabled, capture]);
}
