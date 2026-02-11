import { useEffect, useRef } from 'react';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { cn } from '~/lib/utils';
import { Package, Shield, BarChart3, Settings, Save, FolderOpen, LogOut } from 'lucide-react';

const TABS: { id: PauseMenuTab; label: string; icon: typeof Package }[] = [
  { id: 'items', label: 'Items', icon: Package },
  { id: 'equip', label: 'Equip', icon: Shield },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'options', label: 'Options', icon: Settings },
  { id: 'save', label: 'Save', icon: Save },
  { id: 'load', label: 'Load', icon: FolderOpen },
];

export function PauseMenuSidebar() {
  const { activeTab, selectTab, close } = usePauseMenu();
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  function handleTabClick(tab: PauseMenuTab) {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    selectTab(tab);
  }

  function handleExit() {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    close();
  }

  function handleKeyDown(e: KeyboardEvent) {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      const nextIndex = (currentIndex + direction + TABS.length) % TABS.length;
      handleTabClick(TABS[nextIndex].id);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    activeButtonRef.current?.focus();
  }, [activeTab]);

  return (
    <div className="pause-menu-sidebar">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeButtonRef : null}
            className={cn('pause-menu-nav-btn', isActive && 'active')}
            onClick={() => handleTabClick(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
      <div className="pause-menu-nav-spacer" />
      <button className="pause-menu-exit-btn" onClick={handleExit}>
        <LogOut size={14} />
        Exit
      </button>
    </div>
  );
}
