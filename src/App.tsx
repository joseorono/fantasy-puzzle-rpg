import MouseTracker from '~/components/effects/mouse-tracker';
import { GameLoader } from '~/components/game-loader';
import { GlobalAnimationProvider } from '~/components/global-animations-system';
import WindowFrame from '~/components/window-frame';

function App() {
  return (
    <WindowFrame>
      <GlobalAnimationProvider>
        <MouseTracker />
        <GameLoader />
      </GlobalAnimationProvider>
    </WindowFrame>
  );
}

export default App;
