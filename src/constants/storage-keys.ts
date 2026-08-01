import type { AccessibilitySettings } from '~/types/accessibility-types';
import type { AudioSettings } from '~/types/audio-types';

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
