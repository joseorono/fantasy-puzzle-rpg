/* this is carl's domain */
import { sound } from '@pixi/sound';
import { betweenZeroAndOne, getRandomlyVariedValue } from '~/lib/math';
import { SoundNames } from '~/constants/audio';
import { soundFiles } from '~/constants/audio';

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

  private activeMusicInstances = new Map<
    SoundNames,
    { mediaInstance: { volume: number }; baseVolume: number }
  >();

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
   * Reads persisted volume settings from localStorage (written by Jotai atomWithStorage)
   * and applies them so the SoundService starts with the user's saved preferences.
   */
  private initVolumeFromStorage() {
    try {
      const master = JSON.parse(localStorage.getItem('fpg-master-volume') ?? '100');
      const music = JSON.parse(localStorage.getItem('fpg-music-volume') ?? '80');
      const sfx = JSON.parse(localStorage.getItem('fpg-sfx-volume') ?? '80');
      this.globalVolume = betweenZeroAndOne(master / 100, 'master');
      this.musicVolume = betweenZeroAndOne(music / 100, 'music');
      this.sfxVolume = betweenZeroAndOne(sfx / 100, 'sfx');
    } catch {
      // Use defaults if localStorage values are invalid
    }
  }

  shouldPreload(): boolean {
    return !this.audioLoaded && !this.isPreloading;
  }

  isMuted(): boolean {
    return sound.context.muted;
  }

  async preloadAudios(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('audioLoaded => ', this.audioLoaded);
      if (!this.shouldPreload()) {
        console.log('sound service is already loaded');
        return;
      }
      try {
        this.isPreloading = true;
        let soundsList: Record<string, string> = {};
        for (const [key, val] of Object.entries(soundFiles)) {
          soundsList[key] = val;
        }
        sound.add(soundsList, {
          preload: true,
          loaded: (_) => {
            this.audioLoaded = true;
            this.isPreloading = false;
            sound.context.volume = this.globalVolume;
            console.log('sound service loaded successfully');
            resolve(true);
          },
        });
      } catch (error) {
        console.error('error loading sound service ==> ', error);
        reject(false);
      }
      //  finally {
      //   this.isPreloading = false;
      // }
    });
  }

  playSound(alias: SoundNames, volume: number = 1, volVariance: number = 0, spdVariance: number = 0) {
    volume = betweenZeroAndOne(volume, 'volume');
    volVariance = betweenZeroAndOne(volVariance, 'volVariance');
    spdVariance = betweenZeroAndOne(spdVariance, 'spdVariance');

    sound.play(alias, {
      volume: getRandomlyVariedValue(volume * this.sfxVolume, volVariance),
      speed: getRandomlyVariedValue(1, spdVariance),
    });
  }

  async asyncPlaySound(alias: SoundNames, volume: number = 1, volVariance: number = 0, spdVariance: number = 0) {
    volume = betweenZeroAndOne(volume, 'volume');
    volVariance = betweenZeroAndOne(volVariance, 'volVariance');
    spdVariance = betweenZeroAndOne(spdVariance, 'spdVariance');

    sound.play(alias, {
      volume: getRandomlyVariedValue(volume * this.sfxVolume, volVariance),
      speed: getRandomlyVariedValue(1, spdVariance),
    });
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
    sound.muteAll();
  }

  unmuteAll() {
    sound.unmuteAll();
  }
}

export const soundService = new SoundService();
