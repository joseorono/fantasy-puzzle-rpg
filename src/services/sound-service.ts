/* this is carl's domain */
import { sound } from '@pixi/sound';
import { betweenZeroAndOne, getRandomlyVariedValue } from '~/lib/math';
import { SoundNames } from '~/constants/audio';
import { soundFiles } from '~/constants/audio';
import { AUDIO_DEFAULTS, AUDIO_STORAGE_KEYS } from '~/constants/storage-keys';
import { readPersistedValue, writePersistedValue } from '~/lib/storage';
import { mutedSchema, volumePercentSchema, type AudioSettings } from '~/types/audio-types';

interface MusicPlayOptions {
  fadeIn?: boolean;
  /** Duration of fade-in in milliseconds. Defaults to 1000. */
  fadeInDurationMs?: number;
}

class SoundService {
  private static instance: SoundService;

  // We should probably expose the pixi sound object to the rest of the app as an attribute of this class
  // In JavaScript, objects and arrays are passed by reference, so this will not create a new object
  public static soundApi = sound;

  public audioLoaded: boolean = false;
  public isPreloading: boolean = false;
  public globalVolume: number = 1; //between 0 and 1;
  public musicVolume: number = 1; //between 0 and 1;
  public sfxVolume: number = 1; //between 0 and 1;

  private activeMusicInstances = new Map<SoundNames, { mediaInstance: { volume: number }; baseVolume: number }>();
  private preloadPromise: Promise<boolean> | null = null;

  constructor() {
    if (!SoundService.instance) {
      console.log('created new instance of sound service');
      this.globalVolume = 1;
      this.musicVolume = 1;
      this.sfxVolume = 1;
      this.audioLoaded = false;
      this.isPreloading = false;
      this.initVolumeFromStorage();
      SoundService.instance = this;
    }
    return SoundService.instance;
  }

  /**
   * Reads persisted audio settings from localStorage (written by Jotai atomWithStorage)
   * and applies them so the SoundService starts with the user's saved preferences.
   */
  private initVolumeFromStorage() {
    const settings: AudioSettings = {
      masterVolume: readPersistedValue(
        AUDIO_STORAGE_KEYS.masterVolume,
        volumePercentSchema,
        AUDIO_DEFAULTS.masterVolume,
      ),
      musicVolume: readPersistedValue(AUDIO_STORAGE_KEYS.musicVolume, volumePercentSchema, AUDIO_DEFAULTS.musicVolume),
      sfxVolume: readPersistedValue(AUDIO_STORAGE_KEYS.sfxVolume, volumePercentSchema, AUDIO_DEFAULTS.sfxVolume),
      muted: readPersistedValue(AUDIO_STORAGE_KEYS.muted, mutedSchema, AUDIO_DEFAULTS.muted),
    };

    this.globalVolume = betweenZeroAndOne(settings.masterVolume / 100, 'master');
    this.musicVolume = betweenZeroAndOne(settings.musicVolume / 100, 'music');
    this.sfxVolume = betweenZeroAndOne(settings.sfxVolume / 100, 'sfx');
    this.setMuted(settings.muted);
  }

  shouldPreload(): boolean {
    return !this.audioLoaded && !this.isPreloading;
  }

  isMuted(): boolean {
    return sound.context.muted;
  }

  /**
   * Loads every entry in `soundFiles`. Re-entrant: resolves immediately once loaded and
   * shares the in-flight promise while loading. The pixi `loaded` callback fires once per
   * file, so completions are counted before the batch is reported as loaded.
   */
  preloadAudios(): Promise<boolean> {
    if (this.audioLoaded) return Promise.resolve(true);
    if (this.preloadPromise) return this.preloadPromise;

    this.preloadPromise = new Promise<boolean>((resolve, reject) => {
      const soundsList: Record<string, string> = { ...soundFiles };
      const total = Object.keys(soundsList).length;
      let settledCount = 0;
      let firstError: Error | null = null;

      const finish = () => {
        this.isPreloading = false;
        if (firstError) {
          this.preloadPromise = null;
          reject(firstError);
          return;
        }
        this.audioLoaded = true;
        sound.context.volume = this.globalVolume;
        console.log('sound service loaded successfully');
        resolve(true);
      };

      try {
        this.isPreloading = true;
        sound.add(soundsList, {
          preload: true,
          loaded: (err) => {
            if (err && !firstError) {
              firstError = err;
              console.error('error loading sound ==> ', err);
            }
            settledCount++;
            if (settledCount === total) finish();
          },
        });
      } catch (error) {
        console.error('error loading sound service ==> ', error);
        this.isPreloading = false;
        this.preloadPromise = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return this.preloadPromise;
  }

  /** Resumes a context suspended by the browser's autoplay policy, without overriding an intentional pause. */
  private ensureContextRunning() {
    const ctx = sound.context;
    if (!ctx.paused && ctx.audioContext.state === 'suspended') {
      void ctx.audioContext.resume();
    }
  }

  playSound(alias: SoundNames, volume: number = 1, volVariance: number = 0, spdVariance: number = 0) {
    volume = betweenZeroAndOne(volume, 'volume');
    volVariance = betweenZeroAndOne(volVariance, 'volVariance');
    spdVariance = betweenZeroAndOne(spdVariance, 'spdVariance');

    this.ensureContextRunning();
    sound.play(alias, {
      volume: getRandomlyVariedValue(volume * this.sfxVolume, volVariance),
      speed: getRandomlyVariedValue(1, spdVariance),
    });
  }

  async asyncPlaySound(alias: SoundNames, volume: number = 1, volVariance: number = 0, spdVariance: number = 0) {
    this.playSound(alias, volume, volVariance, spdVariance);
  }

  startMusic(alias: SoundNames, volume: number = 1, options?: MusicPlayOptions) {
    volume = betweenZeroAndOne(volume, 'volume');

    const fadeIn = options?.fadeIn ?? false;
    const fadeInDurationMs = options?.fadeInDurationMs ?? 1000;
    const adjustedVolume = volume * this.musicVolume;

    const trackInstance = (mediaInstance: { volume: number }) => {
      this.activeMusicInstances.set(alias, { mediaInstance, baseVolume: volume });
    };

    if (!fadeIn) {
      const instance = sound.play(alias, { volume: adjustedVolume, loop: true });
      if (instance instanceof Promise) {
        instance.then(trackInstance);
      } else {
        trackInstance(instance);
      }
      return;
    }

    const instance = sound.play(alias, { volume: 0, loop: true });

    // sound.play can return IMediaInstance or Promise<IMediaInstance>
    const applyFade = (mediaInstance: { volume: number }) => {
      trackInstance(mediaInstance);
      const stepIntervalMs = 50;
      const steps = Math.max(1, fadeInDurationMs / stepIntervalMs);
      const volumeStep = adjustedVolume / steps;
      let currentStep = 0;

      const intervalId = setInterval(() => {
        currentStep++;
        mediaInstance.volume = Math.min(adjustedVolume, volumeStep * currentStep);

        if (currentStep >= steps) {
          mediaInstance.volume = adjustedVolume;
          clearInterval(intervalId);
        }
      }, stepIntervalMs);
    };

    if (instance instanceof Promise) {
      instance.then(applyFade);
    } else {
      applyFade(instance);
    }
  }

  stopMusic(alias: SoundNames) {
    sound.stop(alias);
    this.activeMusicInstances.delete(alias);
  }

  setGlobalVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.globalVolume = volume;
    sound.volumeAll = volume;
    sound.context.volume = volume;
  }

  setMusicVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.musicVolume = volume;
    for (const [, entry] of this.activeMusicInstances) {
      entry.mediaInstance.volume = entry.baseVolume * volume;
    }
  }

  setSfxVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.sfxVolume = volume;
  }

  muteAll() {
    this.setMuted(true);
  }

  unmuteAll() {
    this.setMuted(false);
  }

  /** Applies the mute state to the audio context and persists it so it survives a reload. */
  setMuted(muted: boolean) {
    if (muted) {
      sound.muteAll();
    } else {
      sound.unmuteAll();
    }

    writePersistedValue(AUDIO_STORAGE_KEYS.muted, muted);
  }
}

export const soundService = new SoundService();
