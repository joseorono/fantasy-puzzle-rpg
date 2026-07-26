import { describe, expect, it } from 'vitest';
import { getSpriteFrameOrigin, advanceFrame } from './character-sprite';
import type { CharacterSpriteMode } from './character-sprite';

// ---------------------------------------------------------------------------
// getSpriteFrameOrigin
// ---------------------------------------------------------------------------

describe('getSpriteFrameOrigin', () => {
  describe('gutter offsets', () => {
    it('walk·down·frame 0 → { x: 64, y: 644 }', () => {
      expect(getSpriteFrameOrigin('walk', 'down', 0)).toEqual({ x: 64, y: 644 });
    });

    it('sit·right·frame 1 → { x: 64, y: 450 }', () => {
      expect(getSpriteFrameOrigin('sit', 'right', 1)).toEqual({ x: 64, y: 450 });
    });

    it('run·up·frame 0 → { x: 0, y: 0 }', () => {
      expect(getSpriteFrameOrigin('run', 'up', 0)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('direction → row mapping', () => {
    const directions = ['up', 'left', 'down', 'right'] as const;
    const expectedYs = [516, 580, 644, 708]; // stand mode gives a clean baseline

    directions.forEach((dir, i) => {
      it(`stand facing ${dir} → y offset ${expectedYs[i]}`, () => {
        const { y } = getSpriteFrameOrigin('stand', dir, 0);
        expect(y).toBe(expectedYs[i]);
      });
    });
  });

  it('stand ignores frameIndex (always column 0)', () => {
    for (const idx of [0, 1, 5, 99]) {
      expect(getSpriteFrameOrigin('stand', 'up', idx).x).toBe(0);
      expect(getSpriteFrameOrigin('stand', 'down', idx).x).toBe(0);
    }
  });

  it('walk adds 1 to the column offset (frame 0 → col 1)', () => {
    // frame 0 of walk starts at column 1 (stand is column 0)
    for (const dir of ['up', 'left', 'down', 'right'] as const) {
      expect(getSpriteFrameOrigin('walk', dir, 0).x).toBe(64);
    }
  });

  it('walk frame 7 → column 8', () => {
    expect(getSpriteFrameOrigin('walk', 'up', 7).x).toBe(8 * 64); // 512
  });

  it('run frame 0 → column 0', () => {
    expect(getSpriteFrameOrigin('run', 'up', 0).x).toBe(0);
  });

  it('run frame 7 → column 7', () => {
    expect(getSpriteFrameOrigin('run', 'up', 7).x).toBe(7 * 64); // 448
  });
});

// ---------------------------------------------------------------------------
// advanceFrame
// ---------------------------------------------------------------------------

describe('advanceFrame', () => {
  describe('wrap-around', () => {
    it('run 7 → 0', () => {
      expect(advanceFrame('run', 7)).toBe(0);
    });

    it('walk 7 → 0', () => {
      expect(advanceFrame('walk', 7)).toBe(0);
    });

    it('sit 1 → 0', () => {
      expect(advanceFrame('sit', 1)).toBe(0);
    });
  });

  it('stand always returns 0 regardless of input', () => {
    for (const idx of [0, 5, 99]) {
      expect(advanceFrame('stand', idx)).toBe(0);
    }
  });

  it('run cycles sequentially 0→1→2→…→7→0', () => {
    let f = 0;
    for (let i = 1; i <= 8; i++) {
      f = advanceFrame('run', f);
      expect(f).toBe(i % 8);
    }
  });

  it('walk cycles sequentially 0→1→2→…→7→0', () => {
    let f = 0;
    for (let i = 1; i <= 8; i++) {
      f = advanceFrame('walk', f);
      expect(f).toBe(i % 8);
    }
  });

  it('sit toggles between 0 and 1', () => {
    expect(advanceFrame('sit', 0)).toBe(1);
    expect(advanceFrame('sit', 1)).toBe(0);
  });

  it('handles any mode label', () => {
    const modes: CharacterSpriteMode[] = ['walk', 'run', 'stand', 'sit'];
    modes.forEach((mode) => {
      // every mode should return a number without throwing
      const result = advanceFrame(mode, 0);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
