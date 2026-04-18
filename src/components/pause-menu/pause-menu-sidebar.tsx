import { useEffect, useRef } from 'react';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { LogOut } from 'lucide-react';

const TABS: { id: PauseMenuTab; label: string; icon: FrostyRpgIconName }[] = [
  { id: 'items', label: 'Items', icon: 'smallPotion' },
  { id: 'equip', label: 'Equip', icon: 'steelArmor' },
  { id: 'stats', label: 'Stats', icon: 'knifeBlue' },
  { id: 'options', label: 'Options', icon: 'seaSnail' },
  { id: 'save', label: 'Save', icon: 'blueBook' },
  { id: 'load', label: 'Load', icon: 'copperKey' },
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
        const isActive = activeTab === tab.id;
        return (
          <ToffecBeigeCornersWrapper key={tab.id}>
            <button
              ref={isActive ? activeButtonRef : null}
              className={cn('pause-menu-nav-btn', isActive && 'active')}
              onClick={() => handleTabClick(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <FrostyRpgIcon name={tab.icon} size={24} className="pause-menu-nav-icon" />
              {tab.label}
            </button>
          </ToffecBeigeCornersWrapper>
        );
      })}
      <div className="pause-menu-nav-spacer" />
      <ToffecBeigeCornersWrapper>
        <button className="pause-menu-exit-btn" onClick={handleExit}>
          <LogOut size={24} />
          Exit
        </button>
      </ToffecBeigeCornersWrapper>
    </div>
  );
}
