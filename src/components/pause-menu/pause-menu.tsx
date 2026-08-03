import { useAtomValue } from 'jotai';
import { pauseMenuZoneAtom } from '~/stores/pause-menu-atoms';
import { PauseMenuPartyBar } from './pause-menu-party-bar';
import { PauseMenuSidebar } from './pause-menu-sidebar';
import { PauseMenuContent } from './pause-menu-content';

export function PauseMenu() {
  const zone = useAtomValue(pauseMenuZoneAtom);

  return (
    <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
      <PauseMenuPartyBar />
      <div className="pause-menu-body">
        <PauseMenuSidebar />
        <PauseMenuContent />
      </div>
      <span className="pause-menu-key-hint pixel-font">
        {zone === 'sidebar' ? '↑ ↓ select · Enter open · Esc close' : 'Arrows navigate · Enter confirm · ← / Esc back'}
      </span>
    </div>
  );
}
