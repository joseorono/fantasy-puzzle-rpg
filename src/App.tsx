//import BattleScreen from "~/views/battle-screen";
import MouseTracker from "~/components/effects/mouse-tracker";
import InventoryTestView from "~/views/inventory-test";
import ResourcesTestView from "~/views/resources-test";
import SoundTestView from "~/views/sound-test";
import TestView from "~/views/test-view";

function App() {
  return (
  <>
    <TestView />
    <MouseTracker />
    <InventoryTestView />
    <ResourcesTestView />
    <SoundTestView />
    {/* <BattleScreen /> */}
  </>
  );
}

export default App;
