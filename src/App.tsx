//import BattleScreen from "./views/battle-screen";
//import ResourcesTestView from "./views/resources-test";
import MouseTracker from "./components/effects/mouse-tracker";
import InventoryTestView from "./views/inventory-test";
import ResourcesTestView from "./views/resources-test";
import SoundTestView from "./views/sound-test";

function App() {
  return (
  <>
    <MouseTracker />
    <InventoryTestView />
    <ResourcesTestView />
    <SoundTestView />
    {/* <BattleScreen /> */}
  </>
  );
}

export default App;
