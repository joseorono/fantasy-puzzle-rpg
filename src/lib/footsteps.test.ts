import { describe, expect, it } from 'vitest';
import { countStrideCrossings, pickFootstepSample, resolveFootstepPlayback } from './footsteps';
import { FOOTSTEP_FOOT_PITCH_BIAS, FOOTSTEP_PITCH_VARIANCE } from '~/constants/footsteps';

/** Deterministic LCG in [0, 1). */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('countStrideCrossings', () => {
  it('counts nothing within a stride', () => {
    expect(countStrideCrossings(0.2, 0.9, 1)).toBe(0);
  });

  it('counts one crossing at a stride boundary', () => {
    expect(countStrideCrossings(0.9, 1.1, 1)).toBe(1);
  });

  it('counts crossings past the cycle end before the wrap', () => {
    expect(countStrideCrossings(1.9, 2.05, 1)).toBe(1);
  });

  it('counts nothing for zero distance or a degenerate stride', () => {
    expect(countStrideCrossings(1.5, 1.5, 1)).toBe(0);
    expect(countStrideCrossings(0, 5, 0)).toBe(0);
  });
});

describe('pickFootstepSample', () => {
  it('never repeats any of the recent window', () => {
    const random = seededRng(7);
    const recent: number[] = [];
    for (let draw = 0; draw < 2000; draw++) {
      const index = pickFootstepSample(recent, 5, random);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(5);
      expect(recent).not.toContain(index);
      recent.push(index);
      if (recent.length > 2) recent.shift();
    }
  });

  it('still reaches every non-excluded sample', () => {
    const random = seededRng(3);
    const seen = new Set<number>();
    for (let draw = 0; draw < 500; draw++) seen.add(pickFootstepSample([0, 1], 5, random));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });

  it('falls back to the whole pool when the window covers it', () => {
    expect(pickFootstepSample([0], 1, () => 0.5)).toBe(0);
  });
});

describe('resolveFootstepPlayback', () => {
  const base = { baseVolume: 0.8, basePitch: 1 };

  it('keeps volume at or under the baseline when walking', () => {
    const random = seededRng(11);
    for (let draw = 0; draw < 500; draw++) {
      const { volume } = resolveFootstepPlayback({ ...base, running: false, foot: 'left', random });
      expect(volume).toBeLessThanOrEqual(0.8);
      expect(volume).toBeGreaterThan(0);
    }
  });

  it('clamps running volume to 1', () => {
    const { volume } = resolveFootstepPlayback({
      baseVolume: 1,
      basePitch: 1,
      running: true,
      foot: 'left',
      random: () => 0,
    });
    expect(volume).toBe(1);
  });

  it('makes running louder and higher than walking', () => {
    const walk = resolveFootstepPlayback({ ...base, running: false, foot: 'right', random: () => 0.5 });
    const run = resolveFootstepPlayback({ ...base, running: true, foot: 'right', random: () => 0.5 });
    expect(run.volume).toBeGreaterThan(walk.volume);
    expect(run.speed).toBeGreaterThan(walk.speed);
  });

  it('pitches the left foot lower than the right', () => {
    const left = resolveFootstepPlayback({ ...base, running: false, foot: 'left', random: () => 0.5 });
    const right = resolveFootstepPlayback({ ...base, running: false, foot: 'right', random: () => 0.5 });
    expect(right.speed - left.speed).toBeCloseTo(2 * FOOTSTEP_FOOT_PITCH_BIAS);
  });

  it('scales with the map pitch and stays within the jitter band', () => {
    const random = seededRng(5);
    const maxOffset = FOOTSTEP_FOOT_PITCH_BIAS + FOOTSTEP_PITCH_VARIANCE;
    for (let draw = 0; draw < 500; draw++) {
      const { speed } = resolveFootstepPlayback({
        baseVolume: 0.6,
        basePitch: 0.9,
        running: false,
        foot: 'left',
        random,
      });
      expect(speed).toBeGreaterThanOrEqual(0.9 * (1 - maxOffset));
      expect(speed).toBeLessThanOrEqual(0.9 * (1 + maxOffset));
    }
  });
});
