import type { AccessibilitySettings } from '~/types/accessibility-types';
import type { AudioSettings } from '~/types/audio-types';

/** Every save slot, in display order. `autosave` is written by the game, never by the player. */
export const SAVE_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3', 'autosave'] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

/** Slots the player can save into from the Save menu. */
export const MANUAL_SAVE_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'] as const satisfies readonly SaveSlotId[];

/** localStorage keys for the save slots — one key per slot so each gets the full size budget. */
export const SAVE_STORAGE_KEYS = {
  'slot-1': 'fpg-save-slot-1',
  'slot-2': 'fpg-save-slot-2',
  'slot-3': 'fpg-save-slot-3',
  autosave: 'fpg-autosave',
} as const satisfies Record<SaveSlotId, string>;

/** localStorage keys for persisted audio settings, shared by the Jotai atoms and the SoundService. */
export const AUDIO_STORAGE_KEYS = {
  masterVolume: 'fpg-master-volume',
  musicVolume: 'fpg-music-volume',
  sfxVolume: 'fpg-sfx-volume',
  muted: 'fpg-muted',
} as const satisfies Record<keyof AudioSettings, string>;

export type AudioStorageKey = (typeof AUDIO_STORAGE_KEYS)[keyof typeof AUDIO_STORAGE_KEYS];

/** Defaults used when nothing valid is stored yet. Volumes are 0-100 (the slider scale). */
export const AUDIO_DEFAULTS: AudioSettings = {
  masterVolume: 100,
  musicVolume: 80,
  sfxVolume: 80,
  muted: false,
};

/** localStorage keys for persisted accessibility settings. */
export const ACCESSIBILITY_STORAGE_KEYS = {
  reducedMotion: 'fpg-reduced-motion',
} as const satisfies Record<keyof AccessibilitySettings, string>;

export type AccessibilityStorageKey = (typeof ACCESSIBILITY_STORAGE_KEYS)[keyof typeof ACCESSIBILITY_STORAGE_KEYS];

/**
 * Defaults used when nothing valid is stored yet. Reduced motion is strictly opt-in — the game
 * ships at full juice and only calms down once the player asks it to.
 */
export const ACCESSIBILITY_DEFAULTS: AccessibilitySettings = {
  reducedMotion: false,
};
