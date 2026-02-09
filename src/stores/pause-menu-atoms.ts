import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const PAUSE_MENU_TABS = ['items', 'equip', 'stats', 'options', 'save', 'load'] as const;
export type PauseMenuTab = (typeof PAUSE_MENU_TABS)[number];

export const isPauseMenuOpenAtom = atom(false);
export const activeMenuTabAtom = atom<PauseMenuTab>(PAUSE_MENU_TABS[0]);

// Volume settings persisted to localStorage
export const masterVolumeAtom = atomWithStorage('fpg-master-volume', 100);
export const musicVolumeAtom = atomWithStorage('fpg-music-volume', 80);
export const sfxVolumeAtom = atomWithStorage('fpg-sfx-volume', 80);
