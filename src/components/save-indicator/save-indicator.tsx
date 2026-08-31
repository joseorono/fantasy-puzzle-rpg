import { useEffect, useState } from 'react';
import { SAVE_INDICATOR_FADE_MS, SAVE_INDICATOR_HOLD_MS } from '~/constants/game';
import { cn } from '~/lib/utils';

const ICON_SRC = '/assets/icons/indigolay/icon-autosave.png';

interface SaveIndicatorProps {
  /** Autosaves read "Autosaving…"; a save the player asked for reads "Saving…". */
  isAutosave: boolean;
  onDismiss: () => void;
}

/**
 * The little disk badge that blinks in a corner while the game writes a save.
 *
 * Purely a confirmation cue: the localStorage write is synchronous and has already
 * finished by the time this paints, so it signals "that just saved" rather than
 * guarding a window in which quitting would corrupt anything.
 */
export function SaveIndicator({ isAutosave, onDismiss }: SaveIndicatorProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsExiting(true), SAVE_INDICATOR_HOLD_MS);
    const dismissTimer = setTimeout(onDismiss, SAVE_INDICATOR_HOLD_MS + SAVE_INDICATOR_FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
    // Mount-only: the host remounts this via `key` for each new save, so re-running
    // on a changed `onDismiss` identity would only restart the clock mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="save-indicator-layer" aria-hidden>
      {/* motion-hold: with reduced motion on, the animations are cancelled outright rather
          than collapsed to 1ms, so the badge stays legible and the timers above still clear it. */}
      <div className={cn('save-indicator motion-hold', isExiting && 'save-indicator--exiting')}>
        <img src={ICON_SRC} alt="" className="save-indicator__icon indigolay-art" draggable={false} />
        <span className="save-indicator__label pixel-font">{isAutosave ? 'Autosaving…' : 'Saving…'}</span>
      </div>
    </div>
  );
}
