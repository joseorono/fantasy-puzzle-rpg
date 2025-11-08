import { useCurrentView, useViewData } from '~/stores/game-store';
import TownHub from '~/components/town/town-hub';
import DebugView from '~/views/debug-view';
import { DialogueTestView } from './views/dialogue-test';
import { LevelUpDemo } from './views/level-up-demo';
import { MapDemo } from './views/map-demo';
import BattleScreen from "~/views/battle-screen";

/**
 * Main game screen component that renders views based on router state
 */
export default function GameScreen() {
  const currentView = useCurrentView();

  switch (currentView) {
    case 'town-hub':
      // townHubData is guaranteed to exist from INITIAL_ROUTER_STATE
      const townHubData = useViewData('town-hub');
      return (
        <TownHub
          innCost={townHubData!.innCost}
          itemsForSell={townHubData!.itemsForSell}
          onLeaveCallback={townHubData!.onLeaveCallback}
        />
      );

    case 'battle-demo':
      return <BattleScreen />;

    case 'map-demo':
      return <MapDemo />;

    case 'dialogue-demo':
      return <DialogueTestView />;

    case 'level-up':
      // TODO: Implement level-up view
      return <div>Level Up View - Coming Soon</div>;

    case 'level-up-demo':
      return <LevelUpDemo />;

    case 'inventory':
      // TODO: Implement inventory view
      return <div>Inventory View - Coming Soon</div>;

    case 'debug':
      return <DebugView />;

    default:
      return <div>Unknown View: {currentView}</div>;
  }
}
