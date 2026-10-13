import { describe, it, expect } from 'vitest';
import { getStellaMotionOrigin } from './stella-sprites';
import {
  STELLA_SV_FRAME_PX,
  STELLA_SV_FRAMES_PER_MOTION,
  STELLA_SV_MOTIONS,
  STELLA_SV_SHEET_HEIGHT_PX,
  STELLA_SV_SHEET_WIDTH_PX,
  type StellaMotion,
} from '~/constants/stella-sprites';

describe('getStellaMotionOrigin', () => {
  it('maps the sheet corners', () => {
    expect(getStellaMotionOrigin('walk')).toEqual({ x: 0, y: 0 });
    expect(getStellaMotionOrigin('dead')).toEqual({ x: 768, y: 640 });
  });

  it('offsets by frame within a motion block', () => {
    expect(getStellaMotionOrigin('swing', 0)).toEqual({ x: 384, y: 128 });
    expect(getStellaMotionOrigin('swing', 2)).toEqual({ x: 640, y: 128 });
  });

  it('keeps every frame of every motion inside the sheet', () => {
    for (const motion of Object.keys(STELLA_SV_MOTIONS) as StellaMotion[]) {
      for (let frame = 0; frame < STELLA_SV_FRAMES_PER_MOTION; frame++) {
        const { x, y } = getStellaMotionOrigin(motion, frame);
        expect(x + STELLA_SV_FRAME_PX).toBeLessThanOrEqual(STELLA_SV_SHEET_WIDTH_PX);
        expect(y + STELLA_SV_FRAME_PX).toBeLessThanOrEqual(STELLA_SV_SHEET_HEIGHT_PX);
      }
    }
  });

  it('gives each motion a unique block', () => {
    const origins = (Object.keys(STELLA_SV_MOTIONS) as StellaMotion[]).map((m) => {
      const { x, y } = getStellaMotionOrigin(m);
      return `${x},${y}`;
    });
    expect(new Set(origins).size).toBe(18);
  });
});
