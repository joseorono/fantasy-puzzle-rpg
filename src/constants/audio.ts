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
};
