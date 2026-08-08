import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { SAVE_STORAGE_KEYS, type SaveSlotId } from '~/constants/storage-keys';
import { saveSlotSchema } from '~/lib/save-game';
import type { SaveGame } from '~/types/save-game';
import { createValidatedStorage } from './validated-storage';

const saveSlotStorage = createValidatedStorage<SaveGame | null>(saveSlotSchema);

/**
 * One atom per save slot, each on its own localStorage key so a slot's size budget is
 * never shared. A `null` value means the slot is empty — which is also what a corrupt
 * or future-version entry reads back as, since the storage layer validates on read.
 */
export const saveSlotAtoms = {
  'slot-1': atomWithStorage<SaveGame | null>(SAVE_STORAGE_KEYS['slot-1'], null, saveSlotStorage),
  'slot-2': atomWithStorage<SaveGame | null>(SAVE_STORAGE_KEYS['slot-2'], null, saveSlotStorage),
  'slot-3': atomWithStorage<SaveGame | null>(SAVE_STORAGE_KEYS['slot-3'], null, saveSlotStorage),
  autosave: atomWithStorage<SaveGame | null>(SAVE_STORAGE_KEYS.autosave, null, saveSlotStorage),
} as const satisfies Record<SaveSlotId, unknown>;

/**
 * Playtime banked by previous sessions, adopted from a loaded save and reset to 0 on
 * a new game. The live total is this plus the current session's elapsed time.
 */
export const basePlaytimeMsAtom = atom(0);

/** Epoch ms the current play session began; re-stamped on new game and on load. */
export const sessionStartedAtAtom = atom(Date.now());
