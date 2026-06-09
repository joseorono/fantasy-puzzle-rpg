import { atom } from 'jotai';

/**
 * Shared dismissal options every overlay request accepts.
 */
export interface OverlayOptions {
  /** Dismiss when the backdrop is clicked. Default true. */
  dismissOnBackdropClick?: boolean;
  /** Auto-dismiss after N milliseconds; null/undefined disables auto-dismiss. */
  autoDismissMs?: number | null;
}

/**
 * A celebration overlay request. Add a new `kind` variant (plus a content
 * component and a `case` in `OverlayHost`) to introduce a new overlay type.
 */
export type OverlayRequest = OverlayOptions &
  (
    | { kind: 'skill-unlock'; characterId: string; skillId: string }
    | { kind: 'crafting-success'; itemId: string }
  );

/**
 * The single overlay currently being shown, or null. Last request wins — only
 * one celebration shows at a time. Set via `useOverlay`, consumed by `OverlayHost`.
 */
export const activeOverlayAtom = atom<OverlayRequest | null>(null);
