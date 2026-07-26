import { useEffect, useRef } from 'react';

/**
 * Keeps the screen awake via the Wake Lock API while `enabled` is true. The browser
 * force-releases the lock whenever the tab is hidden (spec behavior, not a bug), so
 * this also re-acquires on `visibilitychange` when the tab becomes visible again.
 * No-ops silently on unsupported browsers.
 */
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let isCancelled = false;

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (isCancelled) {
          sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Request can reject if the tab is hidden or the OS denies it (e.g. low
        // battery). Not actionable here — the visibilitychange handler below will
        // retry once the tab is visible again.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire();
      }
    }

    acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [enabled]);
}
