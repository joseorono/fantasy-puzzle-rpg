import { useAtom, useAtomValue } from 'jotai';
import { isPauseMenuOpenAtom, activeMenuTabAtom } from '~/stores/pause-menu-atoms';
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
  const currentView = useCurrentView();
  const isDialogueActive = useAtomValue(isDialogueActiveAtom);

  // Blocked on certain views, and never opened over an active dialogue.
  const isDisabled = DISABLED_VIEWS.includes(currentView) || isDialogueActive;

  function open() {
    if (isDisabled) return;
    // Drop focus from whichever button opened the menu (mouse clicks leave focus behind),
    // so a later Enter can't re-activate a control now hidden behind the overlay.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setActiveTab('items');
    setIsOpen(true);
  }

  function close() {
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
  }

  return { isOpen, isDisabled, activeTab, open, close, toggle, selectTab };
}
