import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { MAP_LOADING_MIN_DURATION_MS } from '~/constants/loading-screen';
import { isMapLoadingScreenActiveAtom } from '~/stores/app-atoms';

interface UseMapLoadingScreenOptions {
  /** Whether this mount gets a loading screen at all (map entry, not a return from battle). */
  isEnabled: boolean;
  /** The map has finished drawing. */
  isReady: boolean;
}

/**
 * Holds the map loading screen up until the map is ready AND `MAP_LOADING_MIN_DURATION_MS`
 * has passed, whichever comes last.
 */
export function useMapLoadingScreen({ isEnabled, isReady }: UseMapLoadingScreenOptions) {
  const [hasMinElapsed, setHasMinElapsed] = useState(!isEnabled);
  const setIsActive = useSetAtom(isMapLoadingScreenActiveAtom);

  useEffect(() => {
    if (!isEnabled) return;
    const timeoutId = setTimeout(() => setHasMinElapsed(true), MAP_LOADING_MIN_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isEnabled]);

  const isVisible = isEnabled && !(isReady && hasMinElapsed);

  useEffect(() => {
    setIsActive(isVisible);
    return () => setIsActive(false);
  }, [isVisible, setIsActive]);

  return { isVisible };
}
