import { useAtomValue } from 'jotai';
import { pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { PauseMenuPartyBar } from './pause-menu-party-bar';
import { PauseMenuSidebar } from './pause-menu-sidebar';
import { PauseMenuContent } from './pause-menu-content';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';

export function PauseMenu() {
  const zone = useAtomValue(pauseMenuZoneAtom);

  return (
    <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
      <PauseMenuPartyBar />
      <div className="pause-menu-body">
        <PauseMenuSidebar />
        <PauseMenuContent />
      </div>
      <KeyHintPill
        className="pause-menu-key-hint"
        items={
          zone === 'sidebar'
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
  );
}
