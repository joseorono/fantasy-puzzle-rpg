import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type PauseMenuTab = 'items' | 'equip' | 'stats' | 'options' | 'save' | 'load';

export const isPauseMenuOpenAtom = atom(false);
export const activeMenuTabAtom = atom<PauseMenuTab>('items');

// Volume settings persisted to localStorage
export const masterVolumeAtom = atomWithStorage('fpg-master-volume', 100);
export const musicVolumeAtom = atomWithStorage('fpg-music-volume', 80);
export const sfxVolumeAtom = atomWithStorage('fpg-sfx-volume', 80);
