import { useState, useEffect } from 'react';
import { loaderService } from '~/services/loader-service';
import { MIN_LOAD_TIME_MS } from '~/constants/game';
import GameScreen from '~/game-screen';
import LoopingProgressBar from '~/components/looping-progress-bar';
import { PauseMenuOverlay } from '~/components/pause-menu/pause-menu-overlay';
import { StartMenu } from '~/components/start-menu';

interface GameLoaderProps {}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function GameLoader(_props: GameLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);

  useEffect(() => {
    if (loaderService.shouldPreload()) {
      loaderService.isPreloading = true;
      Promise.all([loaderService.preloadEverything(), delay(MIN_LOAD_TIME_MS)])
        .then(() => {
          setIsLoading(false);
          setShowStartMenu(true);
        })
        .catch((error) => {
          console.error('Failed to load game assets:', error);
          setHasError(true);
          setIsLoading(false);
        });
    } else if (loaderService.isLoaded) {
      setIsLoading(false);
      setShowStartMenu(true);
    }
  }, []);

  function handleStartMenuClick() {
    setIsReady(true);
  }

  if (isReady) {
    return (
      <>
        <GameScreen />
        <PauseMenuOverlay />
      </>
    );
  }

  if (showStartMenu && !isLoading && !hasError) {
    return (
      <div className="game-view start-menu-view">
        <StartMenu onStartClick={handleStartMenuClick} />
      </div>
    );
  }

  return (
    <div className="game-view splash-screen">
      <div className="splash-screen__bg" />
      <div className="splash-screen__content">
        {isLoading && (
          <>
            <p className="loader__loading-text">Loading...</p>
            <LoopingProgressBar durationInMs={1000} />
          </>
        )}
        {hasError && (
          <div className="text-xl text-red-500">There was an error loading the game. Please refresh and try again.</div>
        )}
      </div>
    </div>
  );
}
