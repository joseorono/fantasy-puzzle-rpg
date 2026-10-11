export type Foot = 'left' | 'right';

export interface FootstepPlaybackInput {
  /** The map's volume baseline (0–1). */
  baseVolume: number;
  /** The map's playback-rate baseline. */
  basePitch: number;
  running: boolean;
  foot: Foot;
  random?: () => number;
}

export interface FootstepPlayback {
  volume: number;
  speed: number;
}
