import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import type { PauseMenuTab } from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { LogOut } from 'lucide-react';

const TABS: { id: PauseMenuTab; label: string; icon: FrostyRpgIconName }[] = [
  { id: 'items', label: 'Items', icon: 'smallPotion' },
  { id: 'equip', label: 'Equip', icon: 'steelSword' },
  { id: 'skills', label: 'Skills', icon: 'openBook' },
  { id: 'stats', label: 'Stats', icon: 'silverArmor' },
  { id: 'options', label: 'Options', icon: 'conch' },
  { id: 'save', label: 'Save', icon: 'blueBook' },
  { id: 'load', label: 'Load', icon: 'copperKey' },
];

export function PauseMenuSidebar() {
  const { activeTab, selectTab, close } = usePauseMenu();
  const [zone, setZone] = useAtom(pauseMenuZoneAtom);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  // The ↑↓ ring is the 7 tabs plus Exit. Landing on a tab activates it immediately
  // (the established feel); landing on Exit only highlights it — Enter closes.
  const [isExitHighlighted, setIsExitHighlighted] = useState(false);

  function handleTabClick(tab: PauseMenuTab) {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setIsExitHighlighted(false);
    selectTab(tab);
  }

  function handleExit() {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    close();
  }

  // ↑↓ (or W/S) cycles the ring; → / Enter hands the keyboard to the content pane.
  // Only bound while the sidebar zone owns the keyboard, so tab content (and a
  // focused Radix slider thumb, which preventDefaults its arrows) is never fought.
  useWindowKeyDown((e) => {
    if (e.defaultPrevented) return;

    const navDirection = getNavDirection(e.key);
    if (navDirection === 'up' || navDirection === 'down') {
      e.preventDefault();
      const ringLength = TABS.length + 1; // + Exit
      const currentIndex = isExitHighlighted ? TABS.length : TABS.findIndex((tab) => tab.id === activeTab);
      const step = navDirection === 'up' ? -1 : 1;
      const nextIndex = (currentIndex + step + ringLength) % ringLength;
      if (nextIndex === TABS.length) {
        setIsExitHighlighted(true);
        soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
      } else {
        handleTabClick(TABS[nextIndex].id);
      }
      return;
    }

    const isEnterContent = navDirection === 'right' || isConfirmKey(e.key);
    if (!isEnterContent) return;
    e.preventDefault();
    if (isConfirmKey(e.key) && e.repeat) return;
    if (isExitHighlighted) {
      if (isConfirmKey(e.key)) handleExit();
      return; // → on Exit deliberately does nothing
    }
    setZone('content');
  }, zone === 'sidebar');

  // Keep DOM focus on the active tab only while the sidebar owns the keyboard;
  // blur on handover so a stray native Enter can't re-click the tab button.
  useEffect(() => {
    if (zone === 'sidebar') activeButtonRef.current?.focus();
    else activeButtonRef.current?.blur();
  }, [activeTab, zone]);

  return (
    <div className="pause-menu-sidebar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <ToffecBeigeCornersWrapper key={tab.id} forceDisplay={zone === 'sidebar' && !isExitHighlighted && isActive}>
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
      <ToffecBeigeCornersWrapper forceDisplay={zone === 'sidebar' && isExitHighlighted}>
        <button className="pause-menu-exit-btn" onClick={handleExit}>
          <LogOut size={24} />
          Exit
        </button>
      </ToffecBeigeCornersWrapper>
    </div>
  );
}
