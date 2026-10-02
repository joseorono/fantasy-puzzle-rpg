import { describe, expect, it } from 'vitest';
import { getSpriteFrameOrigin, advanceFrame, getCharacterSpriteMetrics } from './character-sprite';
import type { CharacterSpriteMode } from './character-sprite';
import { CHARACTER_BODY_HEIGHT_TILES } from '~/constants/character-sprite';
import { MAX_COLLISION_INSET_TILES } from '~/constants/map-movement';

// ---------------------------------------------------------------------------
// getSpriteFrameOrigin
// ---------------------------------------------------------------------------

describe('getSpriteFrameOrigin', () => {
  it('stand plays the Memao idle animation', () => {
    expect(getSpriteFrameOrigin('stand', 'down', 0)).toEqual({ x: 0, y: 0 });
    expect(getSpriteFrameOrigin('stand', 'up', 0)).toEqual({ x: 192, y: 0 });
  });

  it('walk·down·0 → first walk frame', () => {
    expect(getSpriteFrameOrigin('walk', 'down', 0)).toEqual({ x: 0, y: 96 });
  });

  it('run·right·5 → last run frame', () => {
    // run starts at 40; right is the 4th direction block of 6 → 40 + 18 + 5 = 63
    expect(getSpriteFrameOrigin('run', 'right', 5)).toEqual({ x: 7 * 48, y: 7 * 48 });
  });

  it('sit·left·0 → sit block', () => {
    // sit starts at 284; left → +8 → 292 = row 36, col 4
    expect(getSpriteFrameOrigin('sit', 'left', 0)).toEqual({ x: 192, y: 36 * 48 });
  });
});

// ---------------------------------------------------------------------------
// advanceFrame
// ---------------------------------------------------------------------------

describe('advanceFrame', () => {
  it('walk and run cycle through 6 frames', () => {
    for (const mode of ['walk', 'run'] as const) {
      let frame = 0;
      for (let i = 1; i <= 6; i++) {
        frame = advanceFrame(mode, frame);
        expect(frame).toBe(i % 6);
      }
    }
  });

  it('stand loops the 4 idle frames', () => {
    expect(advanceFrame('stand', 2)).toBe(3);
    expect(advanceFrame('stand', 3)).toBe(0);
  });

  it('sit plays once and holds its last frame', () => {
    expect(advanceFrame('sit', 0)).toBe(1);
    expect(advanceFrame('sit', 2)).toBe(3);
    expect(advanceFrame('sit', 3)).toBe(3);
  });

  it('handles any mode label', () => {
    const modes: CharacterSpriteMode[] = ['walk', 'run', 'stand', 'sit'];
    modes.forEach((mode) => {
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
    it('draws a 24x40 body at exactly 1x on a 16px map at the global height', () => {
      const metrics = getCharacterSpriteMetrics(16, CHARACTER_BODY_HEIGHT_TILES, 1, 0);
      expect(metrics.scale).toBeCloseTo(1, 10);
      expect(metrics.bodyWidthPx).toBeCloseTo(24, 10);
      expect(metrics.bodyHeightPx).toBeCloseTo(40, 10);
    });

    it('draws the same 24x40 body at 1x on a 32px map at the Apprentice Forge height', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.25, 1, 0);
      expect(metrics.scale).toBeCloseTo(1, 10);
      expect(metrics.bodyWidthPx).toBeCloseTo(24, 10);
      expect(metrics.bodyHeightPx).toBeCloseTo(40, 10);
    });

    it('leaves the body narrower than a 32px tile, so it clears side walls', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.25, 1, 0);
      expect(32 - metrics.bodyWidthPx).toBeCloseTo(8, 10); // 4px of margin per side
    });
  });

  describe('collision inset', () => {
    it('clamps the 16px maps, whose body is 1.5 tiles wide', () => {
      const metrics = getCharacterSpriteMetrics(16, CHARACTER_BODY_HEIGHT_TILES, 1, 0);
      expect(metrics.collisionInsetPx).toBeCloseTo(MAX_COLLISION_INSET_TILES * 16, 10);
    });

    it('passes the Apprentice Forge through unclamped at the body half-width', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.25, 1, 0);
      expect(metrics.collisionInsetPx).toBeCloseTo(12, 10);
    });

    it('never exceeds the body half-width, so it can never open a gap at a wall', () => {
      for (const [tileSize, heightTiles] of [
        [16, CHARACTER_BODY_HEIGHT_TILES],
        [32, 1.25],
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
      const base = getCharacterSpriteMetrics(32, 1.25, 1, 0.25);
      const zoomed = getCharacterSpriteMetrics(32, 1.25, 2, 0.25);

      expect(zoomed.scale).toBeCloseTo(base.scale * 2, 10);
      expect(zoomed.frameSizePx).toBeCloseTo(base.frameSizePx * 2, 10);
      expect(zoomed.footOffsetPx).toBeCloseTo(base.footOffsetPx * 2, 10);
      expect(zoomed.baselinePadPx).toBeCloseTo(base.baselinePadPx * 2, 10);

      // Map-pixel quantities: resizing the window must not change collision.
      expect(zoomed.bodyWidthPx).toBeCloseTo(base.bodyWidthPx, 10);
      expect(zoomed.bodyHeightPx).toBeCloseTo(base.bodyHeightPx, 10);
      expect(zoomed.collisionInsetPx).toBeCloseTo(base.collisionInsetPx, 10);
    });
  });

  describe('foot offset', () => {
    it('converts tiles to pixels and stays inside the collision inset', () => {
      const metrics = getCharacterSpriteMetrics(32, 1.25, 1, 0.25);
      expect(metrics.footOffsetPx).toBeCloseTo(8, 10);
      // The guarantee that lowered feet can never cross into a wall below.
      expect(metrics.footOffsetPx).toBeLessThanOrEqual(metrics.collisionInsetPx);
    });

    it('drops the frame by its 7px empty strip so the feet rest on the anchor', () => {
      const metrics = getCharacterSpriteMetrics(16, CHARACTER_BODY_HEIGHT_TILES, 1, 0);
      expect(metrics.baselinePadPx).toBeCloseTo(7, 10);
    });
  });
});
