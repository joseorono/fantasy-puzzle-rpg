// import BattleScreen from "~/views/battle-screen";
// import { DialogueTestView } from "~/views/dialogue-test";
import MouseTracker from '~/components/effects/mouse-tracker';
import InventoryTestView from '~/views/inventory-test';
import ResourcesTestView from '~/views/resources-test';
import SoundTestView from '~/views/sound-test';
import TestView from '~/views/test-view';
import PartyTestView from '~/views/party-test';
import TownHub from '~/components/town/town-hub';
import { DialogueTestView } from './views/dialogue-test';
import { LevelUpDemo } from './views/level-up-demo';
import { MapDemo } from './views/map-demo';

function App() {
  return (
    <>
      <TownHub
        innCost={{ coins: 10, gold: 0, silver: 0, bronze: 0, copper: 0 }}
        itemsForSell={['potion']}
        onLeaveCallback={() => {}}
      />
      <TestView />
      <MouseTracker />
      <PartyTestView />
      <InventoryTestView />
      <ResourcesTestView />
      <SoundTestView />
      {/* <LevelUpDemo /> */}
      {/* <MapDemo /> */}
      {/* <DialogueTestView /> */}
      {/* <BattleScreen /> */}
    </>
  );
}

export default App;
