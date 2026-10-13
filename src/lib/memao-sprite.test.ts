import { describe, expect, it } from 'vitest';
import {
  MEMAO_TOTAL_FRAME_COUNT,
  getMemaoFrameIndex,
  getMemaoFrameOrigin,
  getMemaoStepCount,
  getMemaoStepDurationMs,
} from './memao-sprite';
import { MEMAO_ANIMATIONS, MEMAO_SHEET_COLUMNS } from '~/constants/memao-sprite';

describe('Memao sheet layout', () => {
  it('accounts for every frame of the 384x1968 sheet (41 rows, last row half full)', () => {
    expect(MEMAO_TOTAL_FRAME_COUNT).toBe(41 * MEMAO_SHEET_COLUMNS - 4);
  });

  it('gives every animation one duration per playback step', () => {
    for (const animation of MEMAO_ANIMATIONS) {
      expect(animation.frameDurationsMs.length).toBe(getMemaoStepCount(animation.name));
    }
  });
});

describe('getMemaoFrameOrigin', () => {
  it('idle·down·0 is the first frame', () => {
    expect(getMemaoFrameOrigin('idle', 'down', 0)).toEqual({ x: 0, y: 0 });
  });

  it('walk starts after the 16 idle frames', () => {
    expect(getMemaoFrameOrigin('walk', 'down', 0)).toEqual({ x: 0, y: 96 });
  });

  it('directions are stored down, up, left, right', () => {
    expect(getMemaoFrameIndex('walk', 'up', 0)).toBe(22);
    expect(getMemaoFrameIndex('walk', 'left', 0)).toBe(28);
    expect(getMemaoFrameIndex('walk', 'right', 0)).toBe(34);
  });

  it('sit·down·0 sits mid-row', () => {
    expect(getMemaoFrameOrigin('sit', 'down', 0)).toEqual({ x: 192, y: 1680 });
  });

  it('paint has only left and right, ending the sheet', () => {
    expect(getMemaoFrameOrigin('paint', 'left', 0)).toEqual({ x: 192, y: 1872 });
    expect(getMemaoFrameOrigin('paint', 'right', 3)).toEqual({ x: 144, y: 1920 });
  });

  it('paint falls back to left for directions it lacks', () => {
    expect(getMemaoFrameIndex('paint', 'down', 2)).toBe(getMemaoFrameIndex('paint', 'left', 2));
    expect(getMemaoFrameIndex('paint', 'up', 2)).toBe(getMemaoFrameIndex('paint', 'left', 2));
  });

  it('wraps steps past the end of the cycle', () => {
    expect(getMemaoFrameIndex('walk', 'down', 6)).toBe(getMemaoFrameIndex('walk', 'down', 0));
  });
});

describe('sequences', () => {
  it('water plays 0,1,2,3,2,1', () => {
    const start = getMemaoFrameIndex('water', 'down', 0);
    const frames = [0, 1, 2, 3, 4, 5].map((step) => getMemaoFrameIndex('water', 'down', step) - start);
    expect(frames).toEqual([0, 1, 2, 3, 2, 1]);
  });

  it('wave plays 0,1,2,1,2,1,2,3', () => {
    expect(getMemaoStepCount('wave')).toBe(8);
    const start = getMemaoFrameIndex('wave', 'down', 0);
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map((step) => getMemaoFrameIndex('wave', 'down', step) - start);
    expect(frames).toEqual([0, 1, 2, 1, 2, 1, 2, 3]);
  });
});

describe('getMemaoStepDurationMs', () => {
  it('reads the idle timings and wraps', () => {
    expect(getMemaoStepDurationMs('idle', 0)).toBe(500);
    expect(getMemaoStepDurationMs('idle', 3)).toBe(200);
    expect(getMemaoStepDurationMs('idle', 4)).toBe(500);
  });
});
