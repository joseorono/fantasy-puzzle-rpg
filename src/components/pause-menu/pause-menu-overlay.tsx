import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { PAUSE_MENU_HIDDEN_TABS, pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import { KeyboardKeys, isCancelKey, isTutorialKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { PauseMenu } from './pause-menu';

export function PauseMenuOverlay() {
  const { isOpen, isDisabled, activeTab, close, open, openTab } = usePauseMenu();
  const [zone, setZone] = useAtom(pauseMenuZoneAtom);
  const isHiddenTab = PAUSE_MENU_HIDDEN_TABS.includes(activeTab);

  // H / ? toggle the Tutorial tab from anywhere the menu may open, including from another tab.
  useWindowKeyDown((e) => {
    if (!isTutorialKey(e.key) || e.defaultPrevented) return;
    e.preventDefault();
    if (e.repeat) return;
    if (isOpen && activeTab === 'tutorial') {
      close();
      return;
    }
    openTab('tutorial');
  });

  // The app-wide cancel binding lives here — the overlay is mounted exactly once while
  // the game runs — instead of inside usePauseMenu, where every consumer re-bound it.
  // Escape and Backspace both back out one level: content pane → sidebar → closed.
  // Surfaces that must own cancel themselves (the confirm dialog, an Options slider
  // being adjusted) claim it in the capture phase, ahead of this listener.
  useWindowKeyDown((e) => {
    if (!isCancelKey(e.key)) return;
    e.preventDefault();
    // A held key must settle on one state, not flap the menu open and shut.
    if (e.repeat) return;
    // The isOpen check matters: a stale 'content' zone must never swallow the Escape
    // that opens the menu from the game world.
    // A hidden tab has no sidebar entry to back out to.
    if (isOpen && zone === 'content' && !isHiddenTab) {
      setZone('sidebar');
      return;
    }
    if (isOpen) {
      close();
      return;
    }
    // Only Escape opens the menu — Backspace exclusively unwinds, so it can never
    // pull the menu up over the game.
    if (e.key === KeyboardKeys.Escape) open();
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
