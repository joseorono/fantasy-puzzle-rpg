import { useAtomValue } from 'jotai';
import {
  activeMenuTabAtom,
  PAUSE_MENU_HIDDEN_TABS,
  PAUSE_MENU_PARTY_BAR_TABS,
  pauseMenuZoneAtom,
} from '~/stores/pause-menu-atoms';
import { PauseMenuPartyBar } from './pause-menu-party-bar';
import { PauseMenuSidebar } from './pause-menu-sidebar';
import { PauseMenuContent } from './pause-menu-content';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';

export function PauseMenu() {
  const zone = useAtomValue(pauseMenuZoneAtom);
  const activeTab = useAtomValue(activeMenuTabAtom);
  const isHiddenTab = PAUSE_MENU_HIDDEN_TABS.includes(activeTab);

  return (
    <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
      {PAUSE_MENU_PARTY_BAR_TABS.includes(activeTab) && <PauseMenuPartyBar />}
      <div className="pause-menu-body">
        <PauseMenuSidebar />
        <div className="pause-menu-main">
          <PauseMenuContent />
          <div className="pause-menu-key-hint">
            <KeyHintPill
              items={
                isHiddenTab
                  ? [
                      { keys: ['↑', '↓'], label: 'topic' },
                      { keys: ['H', 'Esc'], label: 'close' },
                    ]
                  : zone === 'sidebar'
                    ? [
                        { keys: ['↑', '↓'], label: 'select' },
                        { keys: ['Enter'], label: 'open' },
                        { keys: ['Esc'], label: 'close' },
                      ]
                    : [
                        { keys: ['↑', '↓', '←', '→'], label: 'navigate' },
                        { keys: ['Enter'], label: 'confirm' },
                        { keys: ['Backspace', 'Esc'], label: 'back' },
                      ]
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
