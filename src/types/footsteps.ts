export type Foot = 'left' | 'right';

/** Volume and playback-rate baseline of one gait on one map. */
export interface FootstepGait {
  volume: number;
  pitch: number;
}

/** A map's footstep baselines, resolved once per map. */
export interface FootstepProfile {
  walk: FootstepGait;
  run: FootstepGait;
}

export interface FootstepPlaybackInput {
  gait: FootstepGait;
  foot: Foot;
  random?: () => number;
}

export interface FootstepPlayback {
  volume: number;
  speed: number;
}
