import { useSetAtom } from 'jotai';
import { activeOverlayAtom, type OverlayRequest } from '~/stores/overlay-atoms';

/**
 * Single entry point for showing/dismissing celebration overlays. Any feature
 * calls `showOverlay(request)` to trigger an overlay (skill unlock, crafting
 * success, ...). `OverlayHost` renders whatever is active.
 */
export function useOverlay() {
  const setOverlay = useSetAtom(activeOverlayAtom);

  return {
    showOverlay: (request: OverlayRequest) => setOverlay(request),
    dismissOverlay: () => setOverlay(null),
  };
}
