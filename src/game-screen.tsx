import { useCurrentView, useViewData } from '~/stores/game-store';
import TownHub from '~/components/town/town-hub';
import DebugView from '~/views/debug-view';
import { DialogueTestView } from './views/dialogue-test';
import { LevelUpDemo } from './views/level-up-demo';
import DemoMap from './components/map/demo-map.tsx';
import BattleScreen from '~/views/battle-screen';

/**
 * Main game screen component that renders views based on router state
 */
export default function GameScreen() {
  const currentView = useCurrentView();
  const townHubData = useViewData('town-hub');
  const levelUpDemoData = useViewData('level-up-demo');

  switch (currentView) {
    case 'town-hub':
      // townHubData is guaranteed to exist from INITIAL_ROUTER_STATE
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
      return <DemoMap />;

    case 'dialogue-demo':
      return <DialogueTestView />;

    case 'level-up':
      // TODO: Implement level-up view
      return <div>Level Up View - Coming Soon</div>;

    case 'level-up-demo':
      return <LevelUpDemo id={levelUpDemoData!.id} />;

    case 'inventory':
      // TODO: Implement inventory view
      return <div>Inventory View - Coming Soon</div>;

    case 'debug':
      return <DebugView />;

    default:
      return <div>Unknown View: {currentView}</div>;
  }
}
