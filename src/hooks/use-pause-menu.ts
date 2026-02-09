import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isPauseMenuOpenAtom, activeMenuTabAtom } from '~/stores/pause-menu-atoms';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { useCurrentView } from '~/stores/game-store';
import type { ViewType } from '~/types/routing';

const DISABLED_VIEWS: ViewType[] = ['battle-demo', 'battle-rewards'];

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        toggle();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Auto-close if navigating to a disabled view while open
  useEffect(() => {
    if (isOpen && isDisabled) {
      close();
    }
  }, [currentView]);

  return { isOpen, isDisabled, activeTab, open, close, toggle, selectTab };
}
