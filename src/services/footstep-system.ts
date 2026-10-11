/**
 * Footstep Audio System
 * Plays map footfalls from a small sample pool with per-map volume/pitch baselines,
 * no-repeat sample selection and alternating-foot pitch, so steps don't sound looped.
 */

import { soundService } from './sound-service';
import { FOOTSTEP_SOUNDS } from '~/constants/audio';
import { FOOTSTEP_MIN_INTERVAL_MS, FOOTSTEP_NO_REPEAT_WINDOW } from '~/constants/footsteps';
import { pickFootstepSample, resolveFootstepPlayback } from '~/lib/footsteps';
import type { Foot } from '~/types/footsteps';

interface PlayFootstepOptions {
  running: boolean;
  /** The map's volume baseline (0–1). */
  volume: number;
  /** The map's playback-rate baseline. */
  pitch: number;
}

class FootstepSystem {
  private recentSamples: number[] = [];
  private foot: Foot = 'right';
  private lastFootstepTime = 0;

  /**
   * Plays one footfall unless the previous one was too recent.
   * @returns true if a footstep was played, false if throttled
   */
  playFootstep({ running, volume, pitch }: PlayFootstepOptions): boolean {
    const now = performance.now();
    if (now - this.lastFootstepTime < FOOTSTEP_MIN_INTERVAL_MS) return false;
    this.lastFootstepTime = now;

    const sampleIndex = pickFootstepSample(this.recentSamples, FOOTSTEP_SOUNDS.length);
    this.recentSamples.push(sampleIndex);
    if (this.recentSamples.length > FOOTSTEP_NO_REPEAT_WINDOW) this.recentSamples.shift();

    this.foot = this.foot === 'left' ? 'right' : 'left';
    const playback = resolveFootstepPlayback({ baseVolume: volume, basePitch: pitch, running, foot: this.foot });

    soundService.playSound(FOOTSTEP_SOUNDS[sampleIndex], playback.volume, 0, 0, playback.speed);
    return true;
  }
}

// Singleton instance
export const footstepSystem = new FootstepSystem();
