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
  bossFight = 'bossFight',
  fightMusicLoop = 'fightMusicLoop',
  levelUp = 'levelUp',
  rhodesmasChime = 'rhodesmasChime',
  saveChime = 'saveChime',
  loadChime = 'loadChime',
  runningUpStairs = 'runningUpStairs',
}

/**
 * Every asset that shipped as uncompressed WAV is now Ogg Vorbis: 84.31 MB became 7.40 MB
 * across 17 files. Regenerate with `npm run assets:audio-write -- --tier all`
 * (`scripts/convert-audio.mjs`), which also holds the source-file registry.
 */
export const soundFiles = {
  [SoundNames.bgNoiseMiner]: '/assets/audio/bg-noise/miner.mp3',
  [SoundNames.bgNoiseFarmer]: '/assets/audio/bg-noise/farmer.mp3',
  [SoundNames.bgNoiseForum]: '/assets/audio/bg-noise/forum.mp3',
  [SoundNames.clickChangeTab]: '/assets/audio/click-change-tab.mp3',
  [SoundNames.clickCoin]: '/assets/audio/click-coin.mp3',
  [SoundNames.mechanicalClick]: '/assets/audio/ui/mechanical-click.ogg',
  [SoundNames.shimmeringSuccess]: '/assets/audio/ui/shimmering-success.ogg',
  [SoundNames.shimmeringSuccessShort]: '/assets/audio/ui/shimmering-success-short.ogg',
  [SoundNames.shimmeringSuccessShorter]: '/assets/audio/ui/shimmering-success-shorter.ogg',
  [SoundNames.match]: '/assets/audio/ui/match.ogg',
  [SoundNames.gameOver]: '/assets/audio/ui/game-over.mp3',
  [SoundNames.beep]: '/assets/audio/ui/beep.ogg',
  [SoundNames.wrong]: '/assets/audio/ui/wrong.mp3',
  [SoundNames.bottleClink]: '/assets/audio/bg-noise/bottle-clink.ogg',
  [SoundNames.blacksmith]: '/assets/audio/bg-noise/blacksmith.ogg',
  [SoundNames.blacksmithShorter]: '/assets/audio/bg-noise/blacksmith-shorter.ogg',
  [SoundNames.metalSharpening]: '/assets/audio/bg-noise/metal-sharpening.ogg',
  [SoundNames.jingle]: '/assets/audio/bg-noise/jingle.ogg',
  [SoundNames.uncork]: '/assets/audio/ui/uncork.ogg',
  [SoundNames.combatMusic]: '/assets/audio/bg-noise/combatMusic.ogg',
  [SoundNames.startMenuMusic]: '/assets/audio/ui/epic-cinematic.ogg',
  [SoundNames.bossFight]: '/assets/audio/ui/boss-fight.ogg',
  [SoundNames.fightMusicLoop]: '/assets/audio/ui/fight-music-loop.ogg',
  [SoundNames.levelUp]: '/assets/audio/ui/levelup.ogg',
  [SoundNames.rhodesmasChime]: '/assets/audio/ui/rhodesmas-chime.mp3',
  [SoundNames.saveChime]: '/assets/audio/ui/chime-saved-1.mp3',
  [SoundNames.loadChime]: '/assets/audio/ui/chimes-saved.mp3',
  [SoundNames.runningUpStairs]: '/assets/audio/ui/running-up-the-stairs.ogg',
};

// Background sounds for the town hub (randomly selected on entry)
export const TOWN_HUB_BG_SOUNDS = [SoundNames.bgNoiseForum, SoundNames.bgNoiseFarmer];

/**
 * SFX gains for the town hub and its sub-locations.
 *
 * `mechanical-click.ogg` is mastered at -0.4 dBFS peak — roughly 20 dB hotter than the rest of
 * the UI set — so it needs a far lower gain than its nominal peers to sit at the same perceived
 * level. `transaction` replaces the `playSound` default of 1.0 that the sub-locations were
 * relying on implicitly.
 */
export const TOWN_SFX_VOLUME = {
  /** Clicking a plank on the hub signpost. */
  locationSelect: 0.1,
  /** Ambient one-shot when the hub is entered or returned to. */
  hubAmbience: 0.15,
  /** Buying, crafting, upgrading, salvaging and resting inside a sub-location. */
  transaction: 0.4,
  /** Tick as the keyboard cursor moves between planks, heroes or shop rows. */
  navTick: 0.35,
} as const;

// Volume range for match-3 sounds (scaled by match size)
export const MIN_MATCH_SOUND_VOLUME = 0.6;
export const MAX_MATCH_SOUND_VOLUME = 1;

/**
 * Sound played when wildcard bomb orbs explode. Set to `null` to disable.
 * Temporary: reuses the uncork SFX until a dedicated explosion sound exists.
 */
export const BOMB_EXPLOSION_SOUND: SoundNames | null = SoundNames.uncork;

/**
 * Sound played when an enemy Breaks (poise emptied, attack cancelled). Set to `null` to disable.
 * Temporary: reuses the short blacksmith clang until a dedicated shatter SFX exists.
 */
export const POISE_BREAK_SOUND: SoundNames | null = SoundNames.blacksmithShorter;

/**
 * Swish played as a Row/Column Clear sweeps the board, ahead of the shared match SFX. Set to `null`
 * to disable. Temporary: reuses the metal-sharpening SFX until a dedicated sweep sound exists.
 */
export const LINE_CLEAR_SOUND: SoundNames | null = SoundNames.metalSharpening;

/** SFX gain for `LINE_CLEAR_SOUND`; the match SFX that follows it plays at its usual size-scaled level. */
export const LINE_CLEAR_SOUND_VOLUME = 0.5;
