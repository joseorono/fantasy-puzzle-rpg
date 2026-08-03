import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  ACCESSIBILITY_DEFAULTS,
  ACCESSIBILITY_STORAGE_KEYS,
  AUDIO_DEFAULTS,
  AUDIO_STORAGE_KEYS,
} from '~/constants/storage-keys';
import { reducedMotionSchema } from '~/types/accessibility-types';
import { mutedSchema, volumePercentSchema, type VolumePercent } from '~/types/audio-types';
import { createValidatedStorage } from './validated-storage';

const volumeStorage = createValidatedStorage(volumePercentSchema);
const mutedStorage = createValidatedStorage(mutedSchema);
const reducedMotionStorage = createValidatedStorage(reducedMotionSchema);

export const PAUSE_MENU_TABS = ['items', 'equip', 'skills', 'stats', 'options', 'save', 'load'] as const;
export type PauseMenuTab = (typeof PAUSE_MENU_TABS)[number];

export const isPauseMenuOpenAtom = atom(false);
export const activeMenuTabAtom = atom<PauseMenuTab>(PAUSE_MENU_TABS[0]);

/**
 * Which half of the pause menu owns the keyboard: the sidebar (↑↓ cycles tabs)
 * or the active tab's content pane (arrows navigate its grid). Reset to
 * 'sidebar' on open and on tab change; → / Enter in the sidebar enters content,
 * ← at a content grid's left edge returns.
 */
export type PauseMenuZone = 'sidebar' | 'content';
export const pauseMenuZoneAtom = atom<PauseMenuZone>('sidebar');

// Volume settings persisted to localStorage
export const masterVolumeAtom = atomWithStorage<VolumePercent>(
  AUDIO_STORAGE_KEYS.masterVolume,
  AUDIO_DEFAULTS.masterVolume,
  volumeStorage,
);
export const musicVolumeAtom = atomWithStorage<VolumePercent>(
  AUDIO_STORAGE_KEYS.musicVolume,
  AUDIO_DEFAULTS.musicVolume,
  volumeStorage,
);
export const sfxVolumeAtom = atomWithStorage<VolumePercent>(
  AUDIO_STORAGE_KEYS.sfxVolume,
  AUDIO_DEFAULTS.sfxVolume,
  volumeStorage,
);
// Shared by every mute toggle (start menu, pause menu, battle top bar) so they
// stay in sync, and re-applied by the SoundService on boot.
export const isMutedAtom = atomWithStorage<boolean>(AUDIO_STORAGE_KEYS.muted, AUDIO_DEFAULTS.muted, mutedStorage);

// Accessibility: opt-in only, so the game plays exactly as it always has until the player asks
// otherwise. `useApplyReducedMotion` mirrors every change onto <html> and into `~/lib/reduced-motion`.
export const reducedMotionAtom = atomWithStorage<boolean>(
  ACCESSIBILITY_STORAGE_KEYS.reducedMotion,
  ACCESSIBILITY_DEFAULTS.reducedMotion,
  reducedMotionStorage,
);

// ToDo: For saving, use saveSlotAtom1, saveSlotAtom2, saveSlotAtom3..
