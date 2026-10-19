import { describe, expect, it } from 'vitest';
import {
  getFoeStripFrame,
  getFoeStripRow,
  getFoeWalkLiftPx,
  getFoeWalkScaleY,
  resolveFoeWalkTween,
} from './foe-sprite';
import type { FoeDefinition, FoeMapStrip } from '~/types/foe';
import {
  FOE_DEFAULT_WALK_TWEEN,
  FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND,
  FOE_STRIP_IDLE_ROW,
  FOE_STRIP_MOVE_ROW,
  FOE_WALK_TWEEN_STYLE,
  FOE_WALK_TWEEN_TILES_PER_HOP,
} from '~/constants/foe';

const TILE = 16;

const WALKER: FoeMapStrip = {
  image: '/walker.png',
  cellW: 20,
  cellH: 30,
  anchorX: 10,
  anchorY: 30,
  idle: { frames: 4, frameDurationMs: 100 },
  move: { frames: 8, frameDurationMs: 50 },
};

const FLIER: FoeMapStrip = { ...WALKER, move: undefined };

function definition(overrides: Partial<FoeDefinition> = {}): FoeDefinition {
  return {
    id: 'foe',
    name: 'Test FOE',
    mapSprite: '/x.png',
    speed: 'normal',
    patrol: [{ row: 0, col: 0 }],
    ...overrides,
  };
}

describe('resolveFoeWalkTween', () => {
  it('defaults on without a move row and off with one', () => {
    expect(resolveFoeWalkTween(definition())).toBe(FOE_DEFAULT_WALK_TWEEN);
    expect(resolveFoeWalkTween(definition({ mapStrip: FLIER }))).toBe(FOE_DEFAULT_WALK_TWEEN);
    expect(resolveFoeWalkTween(definition({ mapStrip: WALKER }))).toBe(0);
  });

  it('honours an explicit intensity, clamping negatives to off', () => {
    expect(resolveFoeWalkTween(definition({ mapStrip: WALKER, walkTween: 0.5 }))).toBe(0.5);
    expect(resolveFoeWalkTween(definition({ walkTween: 0 }))).toBe(0);
    expect(resolveFoeWalkTween(definition({ walkTween: -1 }))).toBe(0);
  });
});

describe('getFoeStripRow', () => {
  it('plays the move row only while moving and only if the strip has one', () => {
    expect(getFoeStripRow(WALKER, true)).toBe(FOE_STRIP_MOVE_ROW);
    expect(getFoeStripRow(WALKER, false)).toBe(FOE_STRIP_IDLE_ROW);
    expect(getFoeStripRow(FLIER, true)).toBe(FOE_STRIP_IDLE_ROW);
  });
});

describe('getFoeStripFrame', () => {
  const movePxPerFrame = (50 / 1000) * FOE_MOVE_ANIM_REFERENCE_TILES_PER_SECOND * TILE;

  it('steps the move row by distance walked, ignoring time', () => {
    expect(getFoeStripFrame(WALKER, FOE_STRIP_MOVE_ROW, 0, 12345, TILE)).toBe(0);
    expect(getFoeStripFrame(WALKER, FOE_STRIP_MOVE_ROW, movePxPerFrame * 3.5, 0, TILE)).toBe(3);
    expect(getFoeStripFrame(WALKER, FOE_STRIP_MOVE_ROW, movePxPerFrame * 9.5, 0, TILE)).toBe(1);
  });

  it('steps the idle row by time, ignoring distance', () => {
    expect(getFoeStripFrame(WALKER, FOE_STRIP_IDLE_ROW, 999, 0, TILE)).toBe(0);
    expect(getFoeStripFrame(WALKER, FOE_STRIP_IDLE_ROW, 0, 250, TILE)).toBe(2);
    expect(getFoeStripFrame(WALKER, FOE_STRIP_IDLE_ROW, 0, 450, TILE)).toBe(0);
  });
});

describe('walk tween', () => {
  const hopPx = FOE_WALK_TWEEN_TILES_PER_HOP * TILE;

  it('is the identity at intensity 0', () => {
    for (const distance of [0, hopPx / 4, hopPx / 2, hopPx * 1.7]) {
      expect(getFoeWalkLiftPx(distance, TILE, 0)).toBe(0);
      expect(getFoeWalkScaleY(distance, TILE, 0)).toBe(1);
    }
  });

  it('lifts by whole pixels, peaking mid-hop and landing at each hop', () => {
    expect(getFoeWalkLiftPx(0, TILE, 1)).toBe(0);
    expect(getFoeWalkLiftPx(hopPx / 2, TILE, 1)).toBe(FOE_WALK_TWEEN_STYLE.hopPx);
    expect(getFoeWalkLiftPx(hopPx, TILE, 1)).toBe(0);
    expect(Number.isInteger(getFoeWalkLiftPx(hopPx / 3, TILE, 0.7))).toBe(true);
  });

  it('stretches mid-hop and squashes on landing, scaled by intensity', () => {
    expect(getFoeWalkScaleY(hopPx / 2, TILE, 1)).toBeCloseTo(1 + FOE_WALK_TWEEN_STYLE.squash);
    expect(getFoeWalkScaleY(0, TILE, 1)).toBeCloseTo(1 - FOE_WALK_TWEEN_STYLE.squash);
    expect(getFoeWalkScaleY(hopPx / 2, TILE, 0.5)).toBeCloseTo(1 + FOE_WALK_TWEEN_STYLE.squash / 2);
  });
});
