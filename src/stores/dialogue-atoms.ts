import { atom } from 'jotai';

/**
 * True while a `DialogueScene` is mounted (any source — dungeon event, map
 * event, or the demo view). Read by `usePauseMenu` to block opening the pause
 * menu over a dialogue.
 */
export const isDialogueActiveAtom = atom(false);
