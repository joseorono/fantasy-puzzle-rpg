import MouseTracker from '~/components/effects/mouse-tracker';
import { GameLoader } from '~/components/game-loader';
import { GlobalAnimationProvider } from '~/components/global-animations-system';
import WindowFrame from '~/components/frames/window-frame';
import { TooltipProvider } from '~/components/ui-custom/tooltip';

function App() {
  return (
    <TooltipProvider>
      <WindowFrame>
        <GlobalAnimationProvider>
          <MouseTracker />
          <GameLoader />
        </GlobalAnimationProvider>
      </WindowFrame>
    </TooltipProvider>
  );
}

export default App;
