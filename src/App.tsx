//import BattleScreen from "~/views/battle-screen";
//import { DialogueTestView } from "~/views/dialogue-test";
import MouseTracker from "~/components/effects/mouse-tracker";
import InventoryTestView from "~/views/inventory-test";
import ResourcesTestView from "~/views/resources-test";
import SoundTestView from "~/views/sound-test";
import TestView from "~/views/test-view";
import PartyTestView from "~/views/party-test";

function App() {
  return (
  <>
    <TestView />
    <MouseTracker />
    <PartyTestView />
    <InventoryTestView />
    <ResourcesTestView />
    <SoundTestView />
    {/* <DialogueTestView /> */}
    {/* <BattleScreen /> */}
  </>
  );
}

export default App;
