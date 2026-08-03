import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import { KeyboardKeys } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { PauseMenu } from './pause-menu';

export function PauseMenuOverlay() {
  const { isOpen, isDisabled, close, toggle } = usePauseMenu();
  const [zone, setZone] = useAtom(pauseMenuZoneAtom);

  // The app-wide Escape binding lives here — the overlay is mounted exactly once while
  // the game runs — instead of inside usePauseMenu, where every consumer re-bound it.
  // Escape backs out one level: content pane → sidebar → closed. Surfaces that must own
  // Escape themselves (the confirm dialog, an Options slider being adjusted) claim it in
  // the capture phase, ahead of this listener.
  useWindowKeyDown((e) => {
    if (e.key !== KeyboardKeys.Escape) return;
    e.preventDefault();
    // A held Escape must settle on one state, not flap the menu open and shut.
    if (e.repeat) return;
    // The isOpen check matters: a stale 'content' zone must never swallow the Escape
    // that opens the menu from the game world.
    if (isOpen && zone === 'content') {
      setZone('sidebar');
      return;
    }
    toggle();
  });

  // Auto-close if the menu becomes disabled while open (navigated to a disabled
  // view, or a dialogue started).
  useEffect(() => {
    if (isOpen && isDisabled) {
      close();
    }
  }, [isOpen, isDisabled, close]);

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  return (
    <div className="pause-menu-backdrop" onClick={handleBackdropClick}>
      <PauseMenu />
    </div>
  );
}
