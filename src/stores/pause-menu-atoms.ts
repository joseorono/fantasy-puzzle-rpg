import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AUDIO_DEFAULTS, AUDIO_STORAGE_KEYS } from '~/constants/storage-keys';

export const PAUSE_MENU_TABS = ['items', 'equip', 'stats', 'options', 'save', 'load'] as const;
export type PauseMenuTab = (typeof PAUSE_MENU_TABS)[number];

export const isPauseMenuOpenAtom = atom(false);
export const activeMenuTabAtom = atom<PauseMenuTab>(PAUSE_MENU_TABS[0]);

// Volume settings persisted to localStorage
export const masterVolumeAtom = atomWithStorage(AUDIO_STORAGE_KEYS.masterVolume, AUDIO_DEFAULTS.masterVolume);
export const musicVolumeAtom = atomWithStorage(AUDIO_STORAGE_KEYS.musicVolume, AUDIO_DEFAULTS.musicVolume);
export const sfxVolumeAtom = atomWithStorage(AUDIO_STORAGE_KEYS.sfxVolume, AUDIO_DEFAULTS.sfxVolume);
// Shared by every mute toggle (start menu, pause menu, battle top bar) so they
// stay in sync, and re-applied by the SoundService on boot.
export const isMutedAtom = atomWithStorage<boolean>(AUDIO_STORAGE_KEYS.muted, AUDIO_DEFAULTS.muted);

// ToDo: For saving, use saveSlotAtom1, saveSlotAtom2, saveSlotAtom3..