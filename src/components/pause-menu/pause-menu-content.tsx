import { useAtom } from 'jotai';
import { pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import { cn } from '~/lib/utils';
import { PauseMenuItems } from './tabs/pause-menu-items';
import { PauseMenuEquip } from './tabs/pause-menu-equip';
import { PauseMenuSkills } from './tabs/pause-menu-skills';
import { PauseMenuStats } from './tabs/pause-menu-stats';
import { PauseMenuOptions } from './tabs/pause-menu-options';
import { PauseMenuSave } from './tabs/pause-menu-save';
import { PauseMenuLoad } from './tabs/pause-menu-load';

export function PauseMenuContent() {
  const { activeTab } = usePauseMenu();
  const [zone, setZone] = useAtom(pauseMenuZoneAtom);
  const contentClassName = cn('pause-menu-content', {
    'pause-menu-content--equip': activeTab === 'equip',
    'pause-menu-content--items': activeTab === 'items',
    'pause-menu-content--skills': activeTab === 'skills',
  });

  // Keyboard flows into the active tab only while the content zone owns it. Save/Load
  // are placeholders and stay outside the zone system for now.
  const keyboardActive = zone === 'content';
  const exitToSidebar = () => setZone('sidebar');

  return (
    // Clicking anywhere in the content pane is explicit engagement — subsequent
    // arrow keys act on the content, not the sidebar.
    <div className={contentClassName} onPointerDownCapture={() => setZone('content')}>
      {activeTab === 'items' && <PauseMenuItems keyboardActive={keyboardActive} onExitToSidebar={exitToSidebar} />}
      {activeTab === 'equip' && <PauseMenuEquip keyboardActive={keyboardActive} onExitToSidebar={exitToSidebar} />}
      {activeTab === 'skills' && <PauseMenuSkills keyboardActive={keyboardActive} onExitToSidebar={exitToSidebar} />}
      {activeTab === 'stats' && <PauseMenuStats keyboardActive={keyboardActive} onExitToSidebar={exitToSidebar} />}
      {activeTab === 'options' && <PauseMenuOptions keyboardActive={keyboardActive} onExitToSidebar={exitToSidebar} />}
      {activeTab === 'save' && <PauseMenuSave />}
      {activeTab === 'load' && <PauseMenuLoad />}
    </div>
  );
}
