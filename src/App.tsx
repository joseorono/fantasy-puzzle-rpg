//import BattleScreen from "./views/battle-screen";
//import ResourcesTestView from "./views/resources-test";
import MouseTracker from "./components/effects/mouse-tracker";
import InventoryTestView from "./views/inventory-test";
import ResourcesTestView from "./views/resources-test";

function App() {
  return (
  <>
    <MouseTracker />
    <InventoryTestView />
    <ResourcesTestView />
    {/* <BattleScreen /> */}
  </>
  );
}

export default App;
