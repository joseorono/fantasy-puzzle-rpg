// import { DialogueTestView } from "~/views/dialogue-test";
import MouseTracker from '~/components/effects/mouse-tracker';
import { GameLoader } from '~/components/game-loader';
import { GlobalAnimationProvider } from '~/components/global-animations-system';


function App() {
  return (
    <div id="game-screen">
      <GlobalAnimationProvider>
        <MouseTracker />
        <GameLoader />
      </GlobalAnimationProvider>
    </div>
  )
}

export default App;
