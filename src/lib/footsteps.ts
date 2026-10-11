import {
  FOOTSTEP_FOOT_PITCH_BIAS,
  FOOTSTEP_PITCH_VARIANCE,
  FOOTSTEP_RUN_PITCH_MULTIPLIER,
  FOOTSTEP_VOLUME_VARIANCE,
  FOOTSTEP_WALK_VOLUME_RATIO,
} from '~/constants/footsteps';
import type { FootstepPlayback, FootstepPlaybackInput, FootstepProfile } from '~/types/footsteps';

/**
 * Counts how many stride boundaries were crossed while travelling from `previousDistance`
 * to `nextDistance` along an unwrapped walk-cycle distance.
 *
 * @param previousDistance - Distance into the cycle before this frame's movement.
 * @param nextDistance - Distance after this frame's movement, before any wrap.
 * @param strideDistance - Distance between two footfalls.
 * @returns The number of footfalls that landed during the move (0 when standing still).
 */
export function countStrideCrossings(previousDistance: number, nextDistance: number, strideDistance: number): number {
  if (strideDistance <= 0 || nextDistance <= previousDistance) return 0;
  return Math.floor(nextDistance / strideDistance) - Math.floor(previousDistance / strideDistance);
}

/**
 * Picks the next footstep sample at random, never one of the most recently played.
 *
 * @param recentIndices - Indices played most recently; all are excluded from the pick.
 * @param poolSize - Number of samples in the pool.
 * @param random - Source of randomness in [0, 1).
 * @returns An index in [0, poolSize). Falls back to the full pool when exclusions would empty it.
 */
export function pickFootstepSample(
  recentIndices: readonly number[],
  poolSize: number,
  random: () => number = Math.random,
): number {
  const candidateCount = poolSize - recentIndices.length;
  if (candidateCount <= 0) return Math.floor(random() * poolSize);

  // Walk the pool skipping excluded indices, so no candidate array is allocated.
  let target = Math.floor(random() * candidateCount);
  for (let index = 0; index < poolSize; index++) {
    if (recentIndices.includes(index)) continue;
    if (target === 0) return index;
    target--;
  }
  return 0;
}

/**
 * Resolves a map's walk and run baselines once, so footfalls only look their gait up.
 *
 * Running plays at the map's volume baseline; walking is a subtle step quieter.
 *
 * @param baseVolume - The map's volume baseline (0–1), used as-is for running.
 * @param basePitch - The map's playback-rate baseline, used as-is for walking.
 * @returns The walk and run gaits, volumes clamped to 0–1.
 */
export function createFootstepProfile(baseVolume: number, basePitch: number): FootstepProfile {
  const runVolume = Math.min(1, Math.max(0, baseVolume));
  return {
    walk: { volume: runVolume * FOOTSTEP_WALK_VOLUME_RATIO, pitch: basePitch },
    run: { volume: runVolume, pitch: basePitch * FOOTSTEP_RUN_PITCH_MULTIPLIER },
  };
}

/**
 * Resolves the final volume and playback rate of one footfall.
 *
 * Volume jitter only lowers the gait's volume, so it acts as a ceiling. Pitch jitter is
 * symmetric, with a fixed per-foot bias so left/right alternate audibly.
 *
 * @returns The volume and playback speed to hand to the sound service.
 */
export function resolveFootstepPlayback({ gait, foot, random = Math.random }: FootstepPlaybackInput): FootstepPlayback {
  const volume = gait.volume * (1 - FOOTSTEP_VOLUME_VARIANCE * random());

  const footBias = foot === 'left' ? -FOOTSTEP_FOOT_PITCH_BIAS : FOOTSTEP_FOOT_PITCH_BIAS;
  const jitter = (random() * 2 - 1) * FOOTSTEP_PITCH_VARIANCE;
  const speed = gait.pitch * (1 + footBias + jitter);

  return { volume, speed };
}
