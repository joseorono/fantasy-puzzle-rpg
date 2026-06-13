import { useAtom } from 'jotai';
import { activeOverlayAtom } from '~/stores/overlay-atoms';
import { SkillUnlockOverlay } from './skill-unlock-overlay';
import { CraftingSuccessOverlay } from './crafting-success-overlay';

/**
 * Renders the currently-active celebration overlay (if any). Mounted once
 * globally in `game-loader`. To add a new overlay type: add a `kind` to
 * `OverlayRequest`, a content component, and a `case` here.
 */
export function OverlayHost() {
  const [overlay, setOverlay] = useAtom(activeOverlayAtom);
  if (!overlay) return null;

  const dismiss = () => setOverlay(null);

  switch (overlay.kind) {
    case 'skill-unlock':
      return <SkillUnlockOverlay request={overlay} onDismiss={dismiss} />;
    case 'crafting-success':
      return <CraftingSuccessOverlay request={overlay} onDismiss={dismiss} />;
    default:
      return null;
  }
}
