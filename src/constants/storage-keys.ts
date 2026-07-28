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
