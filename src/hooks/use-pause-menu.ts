import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isPauseMenuOpenAtom, activeMenuTabAtom } from '~/stores/pause-menu-atoms';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { useCurrentView } from '~/stores/game-store';
import { KeyboardKeys } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import type { ViewType } from '~/types/routing';

const DISABLED_VIEWS: ViewType[] = ['battle-demo', 'battle-rewards', 'town-hub'];

export function usePauseMenu() {
  const [isOpen, setIsOpen] = useAtom(isPauseMenuOpenAtom);
  const [activeTab, setActiveTab] = useAtom(activeMenuTabAtom);
  const currentView = useCurrentView();

  const isDisabled = DISABLED_VIEWS.includes(currentView);

  function open() {
    if (isDisabled) return;
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

  useWindowKeyDown((e) => {
    if (e.key === KeyboardKeys.Escape) {
      e.preventDefault();
      toggle();
    }
  });

  // Auto-close if navigating to a disabled view while open
  useEffect(() => {
    if (isOpen && isDisabled) {
      close();
    }
  }, [currentView]);

  return { isOpen, isDisabled, activeTab, open, close, toggle, selectTab };
}
