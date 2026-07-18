import { useEffect, useRef } from 'react';

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
 */
export function useWindowKeyDown(handler: (event: KeyboardEvent) => void, enabled: boolean = true): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    function listener(event: KeyboardEvent) {
      handlerRef.current(event);
    }
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}
