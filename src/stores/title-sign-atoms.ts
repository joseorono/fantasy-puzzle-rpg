import { atom } from 'jotai';

/** Ribbon artwork to display behind the title text. */
export type TitleSignVariant = 'tan' | 'red' | 'large';
/** Text colour inside the ribbon body. */
export type TitleSignTextColor = 'gold' | 'cream' | 'white' | 'dark';
/** Overall scale of the sign (font + ribbon scale together). */
export type TitleSignSize = 'sm' | 'md' | 'lg';
/** Where the sign rests on screen; also determines the slide direction. */
export type TitleSignPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * A request to display a decorative title sign. The `variant`, `textColor`,
 * `size` and `position` fields map 1:1 to the component's `cva` variants; the
 * remaining fields control behaviour. Mirror any change here in `TitleSign`'s
 * `cva` definition and in the `TitleSignTest` debug view.
 */
export interface TitleSignRequest {
  /** Text shown in the ribbon body (e.g. the location name). */
  text: string;
  variant?: TitleSignVariant;
  textColor?: TitleSignTextColor;
  size?: TitleSignSize;
  position?: TitleSignPosition;
  /** Static rest time in ms before it retracts; `null` = stay until the ribbon is clicked. */
  holdMs?: number | null;
  /** Whether the sign slides in on appear. Default true. */
  hasEntryAnimation?: boolean;
}

/**
 * The single title sign currently being shown, or null. Last request wins.
 * Set via `useTitleSign`, consumed by `TitleSignHost`. Kept independent from
 * `activeOverlayAtom` so a title sign can coexist with celebration overlays.
 */
export const titleSignAtom = atom<TitleSignRequest | null>(null);
