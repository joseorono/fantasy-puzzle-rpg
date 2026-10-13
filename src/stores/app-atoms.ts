import { atom } from 'jotai';

/**
 * Whether the player has started the game (left the title/start menu and entered gameplay).
 *
 * `GameLoader` uses this as the menu↔game gate: the start menu flips it to `true`, and flows
 * like a game-over flip it back to `false` to return the player to the start menu.
 */
export const isGameStartedAtom = atom(false);
