import { useEffect } from 'react';
import { DEBUG_MODE } from '~/constants/dev';

/**
 * Suppresses the browser right-click menu across the whole game so right-click can be
 * treated as a game input instead of opening the OS menu. While `DEBUG_MODE` is on the
 * menu is left alone, keeping "Inspect element" available during local iteration.
 *
 * Mount once, at the app root.
 */
export function useDisableContextMenu(): void {
  useEffect(() => {
    if (DEBUG_MODE) return;
    function listener(event: MouseEvent) {
      event.preventDefault();
    }
    window.addEventListener('contextmenu', listener);
    return () => window.removeEventListener('contextmenu', listener);
  }, []);
}
