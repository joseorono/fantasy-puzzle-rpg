// types/store.ts
// Shared types for the Zustand store slices.

/**
 * Base interface for all store slices.
 *
 * Slices deliberately do NOT define their own top-level `reset`: every slice is
 * spread into one store object, so same-named keys collide and only the last one
 * survives. Whole-game resets go through `resetGameState` in the game store.
 */
export interface BaseSlice {
  reset?: never;
}

/**
 * Immer-style setter handed to a slice creator. Mirrors how the slices call it:
 * a mutating recipe plus optional devtools `replace`/`action` arguments.
 */
export type SliceSet<S> = (updater: (state: S) => void, replace?: false, action?: string) => void;

/**
 * Getter handed to a slice creator, returning that slice's state.
 */
export type SliceGet<S> = () => S;
