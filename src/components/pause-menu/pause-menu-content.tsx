import { usePauseMenu } from '~/hooks/use-pause-menu';
import { PauseMenuItems } from './tabs/pause-menu-items';
import { PauseMenuEquip } from './tabs/pause-menu-equip';
import { PauseMenuStats } from './tabs/pause-menu-stats';
import { PauseMenuOptions } from './tabs/pause-menu-options';
import { PauseMenuSave } from './tabs/pause-menu-save';
import { PauseMenuLoad } from './tabs/pause-menu-load';

export function PauseMenuContent() {
  const { activeTab } = usePauseMenu();
  const contentClassName = activeTab === 'equip' ? 'pause-menu-content pause-menu-content--equip' : 'pause-menu-content';

  return (
    <div className={contentClassName}>
      {activeTab === 'items' && <PauseMenuItems />}
      {activeTab === 'equip' && <PauseMenuEquip />}
      {activeTab === 'stats' && <PauseMenuStats />}
      {activeTab === 'options' && <PauseMenuOptions />}
      {activeTab === 'save' && <PauseMenuSave />}
      {activeTab === 'load' && <PauseMenuLoad />}
    </div>
  );
}
