import { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { isGameStartedAtom } from '~/stores/app-atoms';
import { isPauseMenuOpenAtom } from '~/stores/pause-menu-atoms';
import { useRouterActions } from '~/stores/game-store';
import { loaderService } from '~/services/loader-service';
import { MIN_LOAD_TIME_MS } from '~/constants/game';
import { SKIP_TO_DEBUG_VIEW } from '~/constants/dev';
import { useWakeLock } from '~/hooks/use-wake-lock';
import { useBeforeUnloadWarning } from '~/hooks/use-before-unload-warning';
import GameScreen from '~/game-screen';
import LoopingProgressBar from '~/components/looping-progress-bar';
import { PauseMenuOverlay } from '~/components/pause-menu/pause-menu-overlay';
import { OverlayHost } from '~/components/overlays/overlay-host';
import { TitleSignHost } from '~/components/title-sign/title-sign-host';
import { ConfirmDialogHost } from '~/components/confirm-dialog/confirm-dialog-host';
import { SaveIndicatorHost } from '~/components/save-indicator/save-indicator-host';
import { StartMenu } from '~/components/start-menu';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function GameLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Menu↔game gate lives in a global atom so flows like a game-over can return to the title.
  const isReady = useAtomValue(isGameStartedAtom);
  const setGameStarted = useSetAtom(isGameStartedAtom);
  const isPauseMenuOpen = useAtomValue(isPauseMenuOpenAtom);
  const { goToDebug } = useRouterActions();
  const [showStartMenu, setShowStartMenu] = useState(false);

  // Keep the screen awake while actively playing; release it behind the pause menu
  // so the player isn't forced to keep the tab active just to let the display sleep.
  useWakeLock(isReady && !isPauseMenuOpen);

  // Guard against closing or reloading mid-run. Only while in-game: on the title screen
  // there's nothing to lose, and an always-bound handler would cost the page its bfcache entry.
  useBeforeUnloadWarning(isReady);

  useEffect(() => {
    // Dev shortcut: skip the start menu and jump straight into the debug view.
    const onLoaded = () => {
      setIsLoading(false);
      if (SKIP_TO_DEBUG_VIEW) {
        goToDebug();
        setGameStarted(true);
      } else {
        setShowStartMenu(true);
      }
    };

    if (loaderService.shouldPreload()) {
      loaderService.isPreloading = true;
      Promise.all([loaderService.preloadEverything(), delay(MIN_LOAD_TIME_MS)])
        .then(onLoaded)
        .catch((error) => {
          console.error('Failed to load game assets:', error);
          setHasError(true);
          setIsLoading(false);
        });
    } else if (loaderService.isLoaded) {
      onLoaded();
    }
  }, []);

  function handleStartMenuClick() {
    setGameStarted(true);
  }

  if (isReady) {
    return (
      <>
        <GameScreen />
        <PauseMenuOverlay />
        <OverlayHost />
        <TitleSignHost />
        <ConfirmDialogHost />
        <SaveIndicatorHost />
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
      <div className="splash-screen__overlay" />
      <div className="splash-screen__cover" />
      <div className="splash-screen__content">
        {isLoading && (
          <div className="loader-panel">
            <span className="loader-panel__corner loader-panel__corner--tl" />
            <span className="loader-panel__corner loader-panel__corner--tr" />
            <span className="loader-panel__corner loader-panel__corner--bl" />
            <span className="loader-panel__corner loader-panel__corner--br" />
            <p className="loader__loading-text">Now Loading...</p>
            <LoopingProgressBar durationInMs={1000} />
            <p className="loader__hint">Preparing your adventure</p>
          </div>
        )}
        {hasError && (
          <div className="text-xl text-red-500">There was an error loading the game. Please refresh and try again.</div>
        )}
      </div>
    </div>
  );
}
