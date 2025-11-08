// import { DialogueTestView } from "~/views/dialogue-test";
import MouseTracker from '~/components/effects/mouse-tracker';
import { GameLoader } from '~/components/game-loader';
import { GlobalAnimationsOverlay } from '~/components/global-animations-overlay';


function App() {
  return (
    <div id="game-screen">
      <MouseTracker />
      <GlobalAnimationsOverlay />
      <GameLoader />
    </div>
  )
}

export default App;
