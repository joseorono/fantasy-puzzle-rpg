export enum SoundNames {
  bgNoiseMiner = 'bgNoiseMiner',
  bgNoiseFarmer = 'bgNoiseFarmer',
  bgNoiseForum = 'bgNoiseForum',
  clickChangeTab = 'clickChangeTab',
  clickCoin = 'clickCoin',
  mechanicalClick = 'mechanicalClick',
  shimmeringSuccess = 'shimmeringSuccess',
  shimmeringSuccessShort = 'shimmeringSuccessShort',
  shimmeringSuccessShorter = 'shimmeringSuccessShorter',
  match = 'match',
  bottleClink = 'bottleClink',
  uncork = 'uncork',
  blacksmith = 'blacksmith',
  blacksmithShorter = 'blacksmithShorter',
  metalSharpening = 'metalSharpening',
  wrong = 'wrong',
  jingle = 'jingle',
  beep = 'beep',
  gameOver = 'gameOver',
  combatMusic = 'combatMusic',
  startMenuMusic = 'startMenuMusic',
}

export const soundFiles = {
  [SoundNames.bgNoiseMiner]: '/assets/audio/bg-noise/miner.mp3',
  [SoundNames.bgNoiseFarmer]: '/assets/audio/bg-noise/farmer.mp3',
  [SoundNames.bgNoiseForum]: '/assets/audio/bg-noise/forum.mp3',
  [SoundNames.clickChangeTab]: '/assets/audio/click-change-tab.mp3',
  [SoundNames.clickCoin]: '/assets/audio/click-coin.mp3',
  [SoundNames.mechanicalClick]: '/assets/audio/ui/mechanical-click.wav',
  [SoundNames.shimmeringSuccess]: '/assets/audio/ui/shimmering-success.wav',
  [SoundNames.shimmeringSuccessShort]: '/assets/audio/ui/shimmering-success-short.wav',
  [SoundNames.shimmeringSuccessShorter]: '/assets/audio/ui/shimmering-success-shorter.wav',
  [SoundNames.match]: '/assets/audio/ui/match.wav',
  [SoundNames.gameOver]: '/assets/audio/ui/game-over.mp3',
  [SoundNames.beep]: '/assets/audio/ui/beep.wav',
  [SoundNames.wrong]: '/assets/audio/ui/wrong.mp3',
  [SoundNames.bottleClink]: '/assets/audio/bg-noise/bottle-clink.wav',
  [SoundNames.blacksmith]: '/assets/audio/bg-noise/blacksmith.wav',
  [SoundNames.blacksmithShorter]: '/assets/audio/bg-noise/blacksmith-shorter.wav',
  [SoundNames.metalSharpening]: '/assets/audio/bg-noise/metal-sharpening.wav',
  [SoundNames.jingle]: '/assets/audio/bg-noise/jingle.wav',
  [SoundNames.uncork]: '/assets/audio/ui/uncork.wav',
  [SoundNames.combatMusic]: '/assets/audio/bg-noise/combatMusic.wav',
  [SoundNames.startMenuMusic]: '/assets/audio/ui/epic-cinematic.wav',
};

// Background sounds for the town hub (randomly selected on entry)
export const TOWN_HUB_BG_SOUNDS = [SoundNames.bgNoiseForum, SoundNames.bgNoiseFarmer];

// Volume range for match-3 combo sounds (scaled by combo size)
export const MIN_MATCH_SOUND_VOLUME = 0.6;
export const MAX_MATCH_SOUND_VOLUME = 1;
