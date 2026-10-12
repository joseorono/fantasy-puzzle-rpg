import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  isPauseMenuOpenAtom,
  activeMenuTabAtom,
  pauseMenuZoneAtom,
  PAUSE_MENU_HIDDEN_TABS,
} from '~/stores/pause-menu-atoms';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { isDialogueActiveAtom } from '~/stores/dialogue-atoms';
import { useCurrentView } from '~/stores/game-store';
import type { ViewType } from '~/types/routing';

const DISABLED_VIEWS: ViewType[] = ['battle-demo', 'battle-rewards', 'town-hub'];

/**
 * Pause menu state accessor. Deliberately side-effect free: the global Escape binding
 * and the auto-close-when-disabled effect live in `PauseMenuOverlay` (mounted once for
 * the whole game), so the many consumers of this hook don't each re-bind them.
 */
export function usePauseMenu() {
  const [isOpen, setIsOpen] = useAtom(isPauseMenuOpenAtom);
  const [activeTab, setActiveTab] = useAtom(activeMenuTabAtom);
  const setZone = useSetAtom(pauseMenuZoneAtom);
  const currentView = useCurrentView();
  const isDialogueActive = useAtomValue(isDialogueActiveAtom);

  // Blocked on certain views, and never opened over an active dialogue.
  const isDisabled = DISABLED_VIEWS.includes(currentView) || isDialogueActive;

  /** Open the menu on a given tab. A hidden tab has no sidebar entry, so its content takes the keyboard. */
  function openTab(tab: PauseMenuTab) {
    if (isDisabled) return;
    // Drop focus from whichever button opened the menu (mouse clicks leave focus behind),
    // so a later Enter can't re-activate a control now hidden behind the overlay.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setActiveTab(tab);
    setZone(PAUSE_MENU_HIDDEN_TABS.includes(tab) ? 'content' : 'sidebar');
    setIsOpen(true);
  }

  // Takes no arguments, so it can be handed straight to an onClick.
  function open() {
    openTab('items');
  }

  function close() {
    // Re-arm the zone so a close from inside a tab (backdrop click, Exit button) can't
    // leave 'content' behind for the next open.
    setZone('sidebar');
    setIsOpen(false);
  }

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function selectTab(tab: PauseMenuTab) {
    setActiveTab(tab);
    // A tab change always lands you back on the sidebar, whether it came from a
    // mouse click or from the sidebar's ↑↓ cycling.
    setZone('sidebar');
  }

  return { isOpen, isDisabled, activeTab, open, openTab, close, toggle, selectTab };
}
