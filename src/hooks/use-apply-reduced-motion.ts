import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { applyReducedMotion } from '~/lib/reduced-motion';
import { reducedMotionAtom } from '~/stores/pause-menu-atoms';

/**
 * Keeps the reduced-motion setting applied to the document: toggles the `data-reduced-motion`
 * attribute the global CSS overrides key off, and updates the value `isReducedMotion()` returns to
 * JS-driven animations. Mount once, at the app root.
 */
export function useApplyReducedMotion(): void {
  const reducedMotion = useAtomValue(reducedMotionAtom);

  useEffect(() => {
    applyReducedMotion(reducedMotion);
  }, [reducedMotion]);
}
