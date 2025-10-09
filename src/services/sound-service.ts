/* this is carl's domain */
import { sound } from '@pixi/sound';
import { betweenZeroAndOne, getRandomlyVariedValue } from '~/lib/math';

export enum SoundNames {
  backgroundMusic2 = 'backgroundMusic2',
  fanfare = 'fanfare',
  buyMiner = 'buyMiner',
  buySlave = 'buySlave',
  buyFarmer = 'buyFarmer',
  buyBaker = 'buyBaker',
  buyMercator = 'buyMercator',
  buySmith = 'buySmith',
  buyLegionary = 'buyLegionary',
  buyPriest = 'buyPriest',
  buyForum = 'buyForum',
  closeModal = 'closeModal',
  click = 'click',
  coinClick = 'coinClick',
  upgrade = 'upgrade',
  buyFields = 'buyFields',
  levelUp = 'levelUp',
  gameOver = 'gameOver',
}

const soundFiles = {
  [SoundNames.backgroundMusic2]: 'assets/audio/bgm2.mp3',
  [SoundNames.fanfare]: 'assets/audio/fanfare.mp3',
  [SoundNames.buyMiner]: 'assets/audio/buyMiner.mp3',
  [SoundNames.buySlave]: 'assets/audio/buySlave.mp3',
  [SoundNames.buyFarmer]: 'assets/audio/buyFarmer.mp3',
  [SoundNames.buyBaker]: 'assets/audio/buyBaker.mp3',
  [SoundNames.buyMercator]: 'assets/audio/buyMercator.mp3',
  [SoundNames.buySmith]: 'assets/audio/buySmith.mp3',
  [SoundNames.buyLegionary]: 'assets/audio/buyLegionary.mp3',
  [SoundNames.buyPriest]: 'assets/audio/buyPriest.mp3',
  [SoundNames.buyForum]: 'assets/audio/buyForum.mp3',
  [SoundNames.closeModal]: 'assets/audio/closeModal.mp3',
  [SoundNames.click]: 'assets/audio/click.mp3',
  [SoundNames.coinClick]: 'assets/audio/coin.mp3',
  [SoundNames.upgrade]: 'assets/audio/upgrade.mp3',
  [SoundNames.buyFields]: 'assets/audio/buyFields.mp3',
  [SoundNames.levelUp]: 'assets/audio/levelUp.mp3',
  [SoundNames.gameOver]: 'assets/audio/gameOver.mp3',
};

class SoundService {
  private static instance: SoundService;

  // We should probably expose the pixi sound object to the rest of the app as an attribute of this class
  // In JavaScript, objects and arrays are passed by reference, so this will not create a new object
  public static soundApi = sound;

  public audioLoaded: boolean;
  public isPreloading: boolean;
  public globalVolume: number; //between 0 and 1;

  constructor() {
    if (!SoundService.instance) {
      console.log('created new instance of sound service');
      this.globalVolume = 1;
      this.audioLoaded = false;
      this.isPreloading = false;
      SoundService.instance = this;
    }
    return SoundService.instance;
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

  playSound(alias: SoundNames, volume: number = 1, variance: number = 0) {
    volume = betweenZeroAndOne(volume, 'volume');
    variance = betweenZeroAndOne(variance, 'variance');

    sound.play(alias, {
      volume: getRandomlyVariedValue(volume, variance),
    });
  }

  async asyncPlaySouund(alias: SoundNames, volume: number = 1, variance: number = 0) {
    volume = betweenZeroAndOne(volume, 'volume');
    variance = betweenZeroAndOne(variance, 'variance');

    sound.play(alias, {
      volume: getRandomlyVariedValue(volume, variance),
    });
  }

  startMusic(alias: SoundNames, volume: number = 1) {
    volume = betweenZeroAndOne(volume, 'volume');
    sound.play(alias, {
      volume: volume,
      loop: true,
    });
  }

  stopMusic(alias: SoundNames) {
    sound.stop(alias);
  }

  setGlobalVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    //sets current sounds volume
    sound.volumeAll = volume;
    //sets following sounds maximum volume;
    sound.context.volume = volume;
  }

  muteAll() {
    sound.muteAll();
  }

  unmuteAll() {
    sound.unmuteAll();
  }
}

export const soundService = new SoundService();
