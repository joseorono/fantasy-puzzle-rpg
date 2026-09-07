import { describe, expect, it } from 'vitest';
import { getSpriteFrameOrigin, advanceFrame, getCharacterSpriteMetrics } from './character-sprite';
import type { CharacterSpriteMode } from './character-sprite';
import { CHARACTER_BODY_HEIGHT_TILES } from '~/constants/character-sprite';
import { MAX_COLLISION_INSET_TILES } from '~/constants/map-movement';

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

// ---------------------------------------------------------------------------
// getCharacterSpriteMetrics
// ---------------------------------------------------------------------------

describe('getCharacterSpriteMetrics', () => {
  describe('body sizing', () => {
    it('draws a 28x42 body on a 16px map at the global height', () => {
      // Pins the "16px maps are untouched" guarantee: the old frame-based 3.5 tiles
      // produced exactly this, so map-00 and map-01 must not shift by a pixel.
      const metrics = getCharacterSpriteMetrics(16, CHARACTER_BODY_HEIGHT_TILES, 1, 0);
      expect(metrics.scale).toBeCloseTo(0.875, 10);
      expect(metrics.bodyWidthPx).toBeCloseTo(28, 10);
      expect(metrics.bodyHeightPx).toBeCloseTo(42, 10);
    });

    it('draws the same 28x42 body on a 32px map at the Apprentice Forge height', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.3125, 1, 0);
      expect(metrics.scale).toBeCloseTo(0.875, 10);
      expect(metrics.bodyWidthPx).toBeCloseTo(28, 10);
      expect(metrics.bodyHeightPx).toBeCloseTo(42, 10);
    });

    it('leaves the body narrower than a 32px tile, so it clears side walls', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.3125, 1, 0);
      expect(32 - metrics.bodyWidthPx).toBeCloseTo(4, 10); // 2px of margin per side
    });
  });

  describe('collision inset', () => {
    it('clamps the 16px maps, whose body is 1.75 tiles wide', () => {
      const metrics = getCharacterSpriteMetrics(16, CHARACTER_BODY_HEIGHT_TILES, 1, 0);
      expect(metrics.collisionInsetPx).toBeCloseTo(MAX_COLLISION_INSET_TILES * 16, 10);
    });

    it('clamps the Apprentice Forge, whose half-width just exceeds the ceiling', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.3125, 1, 0);
      expect(metrics.collisionInsetPx).toBeCloseTo(MAX_COLLISION_INSET_TILES * 32, 10);
    });

    it('passes a narrow body through unclamped', () => {
      // 0.6 tiles of body width -> a 0.3 tile half-width, comfortably under the ceiling.
      const metrics = getCharacterSpriteMetrics(32, 0.9, 1, 0);
      expect(metrics.bodyWidthPx).toBeCloseTo(19.2, 10);
      expect(metrics.collisionInsetPx).toBeCloseTo(9.6, 10);
    });

    it('never exceeds the body half-width, so it can never open a gap at a wall', () => {
      for (const [tileSize, heightTiles] of [
        [16, CHARACTER_BODY_HEIGHT_TILES],
        [32, 1.3125],
        [32, 0.9],
        [8, 1],
      ] as const) {
        const metrics = getCharacterSpriteMetrics(tileSize, heightTiles, 1, 0);
        expect(metrics.collisionInsetPx).toBeLessThanOrEqual(metrics.bodyWidthPx / 2 + 1e-9);
      }
    });
  });

  describe('display scale', () => {
    it('scales what is drawn but never what is simulated', () => {
      const base = getCharacterSpriteMetrics(32, 1.3125, 1, 0.25);
      const zoomed = getCharacterSpriteMetrics(32, 1.3125, 2, 0.25);

      expect(zoomed.scale).toBeCloseTo(base.scale * 2, 10);
      expect(zoomed.frameSizePx).toBeCloseTo(base.frameSizePx * 2, 10);
      expect(zoomed.footOffsetPx).toBeCloseTo(base.footOffsetPx * 2, 10);

      // Map-pixel quantities: resizing the window must not change collision.
      expect(zoomed.bodyWidthPx).toBeCloseTo(base.bodyWidthPx, 10);
      expect(zoomed.bodyHeightPx).toBeCloseTo(base.bodyHeightPx, 10);
      expect(zoomed.collisionInsetPx).toBeCloseTo(base.collisionInsetPx, 10);
    });
  });

  describe('foot offset', () => {
    it('converts tiles to pixels and stays inside the collision inset', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.3125, 1, 0.25);
      expect(metrics.footOffsetPx).toBeCloseTo(8, 10);
      // The guarantee that lowered feet can never cross into a wall below.
      expect(metrics.footOffsetPx).toBeLessThanOrEqual(metrics.collisionInsetPx);
    });
  });
});
