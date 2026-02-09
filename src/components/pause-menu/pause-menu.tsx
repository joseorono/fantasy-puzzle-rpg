import { PauseMenuPartyBar } from './pause-menu-party-bar';
import { PauseMenuSidebar } from './pause-menu-sidebar';
import { PauseMenuContent } from './pause-menu-content';

export function PauseMenu() {
  return (
    <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
      <PauseMenuPartyBar />
      <div className="pause-menu-body">
        <PauseMenuSidebar />
        <PauseMenuContent />
      </div>
    </div>
  );
}
