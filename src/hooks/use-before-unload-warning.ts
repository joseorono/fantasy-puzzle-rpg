import { useEffect } from 'react';
import { isElectron } from '~/lib/electron-detector';

/**
 * Asks the browser to confirm before the tab is closed or reloaded while `enabled`
 * is true, so a stray Ctrl+W or F5 can't throw away progress since the last save.
 *
 * The prompt's wording belongs to the browser — a page cannot supply its own text,
 * and browsers only show it at all once the player has interacted with the page.
 * Both are spec behaviour, not something to work around.
 *
 * The listener is attached only while `enabled`, which matters for more than tidiness:
 * a registered `beforeunload` handler disqualifies the page from the back/forward
 * cache, so leaving one bound on the title screen would slow navigation back to a game
 * nobody is playing.
 *
 * No-ops under Electron. There, cancelling the unload silently prevents the window from
 * closing instead of raising a dialog, which would leave the app impossible to quit.
 *
 * @param enabled Whether there is progress worth guarding (i.e. the player is in-game).
 */
export function useBeforeUnloadWarning(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || isElectron()) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      // preventDefault is the standard trigger; returnValue is the legacy one some
      // browsers still require. Neither controls the message shown.
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);
}
