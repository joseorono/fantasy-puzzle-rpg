import { useState, useEffect } from 'react';
import { loaderService } from '~/services/loader-service';
import GameScreen from '~/game-screen';
import LoopingProgressBar from '~/components/looping-progress-bar';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

interface GameLoaderProps {}

export function GameLoader(_props: GameLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loaderService.shouldPreload()) {
      loaderService.isPreloading = true;
      loaderService
        .preloadEverything()
        .then(() => {
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to loa d game assets:', error);
          setHasError(true);
          setIsLoading(false);
        });
    } else if (loaderService.isLoaded) {
      setIsLoading(false);
    }
  }, []);

  function handlePlayClick() {
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    setIsReady(true);
  }

  if (isReady) {
    return (
      <>
        <GameScreen />
      </>
    );
  }

  return (
    <div className="game-view splash-screen">
      <div className="splash-screen__bg" />
      <div className="splash-screen__content">
        {isLoading && (
          <>
            <h1 className="text-4xl text-white">Loading...</h1>
            <LoopingProgressBar durationInMs={1000} />
          </>
        )}
        {hasError && (
          <div className="text-xl text-red-500">There was an error loading the game. Please refresh and try again.</div>
        )}
        {!isLoading && !hasError && (
          <button onClick={handlePlayClick} disabled={isLoading} className="splash-screen__button">
            Play!
          </button>
        )}
      </div>
    </div>
  );
}
