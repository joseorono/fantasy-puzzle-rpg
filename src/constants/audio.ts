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
  [SoundNames.bossFight]: '/assets/audio/ui/boss-fight.wav',
  [SoundNames.fightMusicLoop]: '/assets/audio/ui/fight-music-loop.wav',
  [SoundNames.levelUp]: '/assets/audio/ui/levelup.ogg',
  [SoundNames.rhodesmasChime]: '/assets/audio/ui/rhodesmas-chime.mp3',
};

// Background sounds for the town hub (randomly selected on entry)
export const TOWN_HUB_BG_SOUNDS = [SoundNames.bgNoiseForum, SoundNames.bgNoiseFarmer];

/**
 * SFX gains for the town hub and its sub-locations.
 *
 * `mechanical-click.wav` is mastered at -0.4 dBFS peak — roughly 20 dB hotter than the rest of
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
