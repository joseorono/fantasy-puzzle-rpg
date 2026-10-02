import { describe, expect, it } from 'vitest';
import {
  advanceCamera,
  computeViewportLayout,
  getCameraTarget,
  getSpriteTranslation,
  mapToClientPoint,
  mapToViewportPoint,
  resolveMapZoom,
  roundCamera,
  viewportToMapPoint,
  type CameraTunables,
} from './map-camera';

const MAP = { width: 1920, height: 1280 };

// ---------------------------------------------------------------------------
// resolveMapZoom
// ---------------------------------------------------------------------------

describe('resolveMapZoom', () => {
  it('defaults to native size', () => {
    expect(resolveMapZoom(undefined)).toBe(1);
    expect(resolveMapZoom(Number.NaN)).toBe(1);
    expect(resolveMapZoom(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('floors fractions and clamps below 1', () => {
    expect(resolveMapZoom(2.7)).toBe(2);
    expect(resolveMapZoom(0)).toBe(1);
    expect(resolveMapZoom(-3)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeViewportLayout
// ---------------------------------------------------------------------------

describe('computeViewportLayout', () => {
  it('shrinks to the map when the map is smaller than the space', () => {
    expect(computeViewportLayout({ width: 2000, height: 1500 }, { width: 1440, height: 960 }, 1)).toEqual({
      zoom: 1,
      viewWidth: 1440,
      viewHeight: 960,
      cssWidth: 1440,
      cssHeight: 960,
    });
  });

  it('shows only what fits when the map is larger', () => {
    const layout = computeViewportLayout({ width: 1200, height: 700 }, MAP, 1);
    expect(layout).toMatchObject({ viewWidth: 1200, viewHeight: 700, cssWidth: 1200, cssHeight: 700 });
  });

  it('handles a map wider but shorter than the space', () => {
    const layout = computeViewportLayout({ width: 1000, height: 2000 }, MAP, 1);
    expect(layout).toMatchObject({ viewWidth: 1000, viewHeight: 1280 });
  });

  it('keeps the CSS size a whole multiple of the zoom and inside the space', () => {
    const layout = computeViewportLayout({ width: 1001, height: 701 }, MAP, 2);
    expect(layout).toMatchObject({ viewWidth: 500, viewHeight: 350, cssWidth: 1000, cssHeight: 700 });
  });

  it('scales a small map up by the zoom', () => {
    const layout = computeViewportLayout({ width: 4000, height: 4000 }, { width: 320, height: 240 }, 3);
    expect(layout).toMatchObject({ viewWidth: 320, viewHeight: 240, cssWidth: 960, cssHeight: 720 });
  });

  it('returns null when not a single map pixel fits', () => {
    expect(computeViewportLayout({ width: 0, height: 500 }, MAP, 1)).toBeNull();
    expect(computeViewportLayout({ width: 1, height: 500 }, MAP, 2)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getCameraTarget
// ---------------------------------------------------------------------------

describe('getCameraTarget', () => {
  const view = { viewWidth: 800, viewHeight: 600 };

  it('centres on the focus mid-map', () => {
    expect(getCameraTarget({ x: 960, y: 640 }, view, MAP)).toEqual({ x: 560, y: 340 });
  });

  it('stops at the top-left edge', () => {
    expect(getCameraTarget({ x: 10, y: 10 }, view, MAP)).toEqual({ x: 0, y: 0 });
  });

  it('stops at the bottom-right edge', () => {
    expect(getCameraTarget({ x: 1910, y: 1270 }, view, MAP)).toEqual({ x: 1120, y: 680 });
  });

  it('stays at 0 on an axis where the view spans the whole map', () => {
    const fullWidth = { viewWidth: 1920, viewHeight: 600 };
    expect(getCameraTarget({ x: 1900, y: 640 }, fullWidth, MAP)).toEqual({ x: 0, y: 340 });
  });

  it('is never negative, even for a view larger than the map', () => {
    const target = getCameraTarget({ x: 5, y: 5 }, { viewWidth: 3000, viewHeight: 3000 }, MAP);
    expect(target).toEqual({ x: 0, y: 0 });
  });
});

// ---------------------------------------------------------------------------
// advanceCamera
// ---------------------------------------------------------------------------

describe('advanceCamera', () => {
  const tunables: CameraTunables = { halfLifeSeconds: 0.1, snapDistancePx: 0.5 };
  const start = { x: 0, y: 0 };
  const target = { x: 100, y: 40 };

  it('does not move without elapsed time', () => {
    expect(advanceCamera(start, target, 0, tunables)).toEqual(start);
  });

  it('closes half the gap per half-life', () => {
    const next = advanceCamera(start, target, 0.1, tunables);
    expect(next.x).toBeCloseTo(50, 9);
    expect(next.y).toBeCloseTo(20, 9);
  });

  it('never overshoots', () => {
    const next = advanceCamera(start, target, 10, tunables);
    expect(next).toEqual(target);
    expect(advanceCamera({ x: 99, y: 39 }, target, 0.016, tunables).x).toBeLessThanOrEqual(100);
  });

  it('is frame-rate independent', () => {
    const halfLife = { halfLifeSeconds: 0.1, snapDistancePx: 0 };
    const oneStep = advanceCamera(start, target, 1 / 30, halfLife);
    const twoSteps = advanceCamera(advanceCamera(start, target, 1 / 60, halfLife), target, 1 / 60, halfLife);
    expect(twoSteps.x).toBeCloseTo(oneStep.x, 9);
    expect(twoSteps.y).toBeCloseTo(oneStep.y, 9);
  });

  it('lands exactly on the target within a second at 60 fps', () => {
    let camera = start;
    for (let frame = 0; frame < 60; frame++) camera = advanceCamera(camera, target, 1 / 60, tunables);
    expect(camera).toEqual(target);
  });

  it('snaps each axis on its own once within the snap distance', () => {
    const next = advanceCamera({ x: 99.6, y: 0 }, target, 0.001, tunables);
    expect(next.x).toBe(100);
    expect(next.y).toBeLessThan(40);
  });

  it('locks to the target with a zero half-life', () => {
    expect(advanceCamera(start, target, 0.016, { halfLifeSeconds: 0, snapDistancePx: 0.5 })).toEqual(target);
  });
});

// ---------------------------------------------------------------------------
// roundCamera + conversions
// ---------------------------------------------------------------------------

describe('roundCamera', () => {
  it('rounds to whole map pixels without touching the input', () => {
    const raw = { x: 12.4, y: 7.6 };
    expect(roundCamera(raw)).toEqual({ x: 12, y: 8 });
    expect(raw).toEqual({ x: 12.4, y: 7.6 });
  });
});

describe('conversions', () => {
  const camera = { x: 37, y: 12 };

  it('round-trips map → viewport → map at any zoom', () => {
    const point = { x: 704.25, y: 928.5 };
    const back = viewportToMapPoint(mapToViewportPoint(point, camera, 3), camera, 3);
    expect(back.x).toBeCloseTo(point.x, 9);
    expect(back.y).toBeCloseTo(point.y, 9);
  });

  it('offsets client points by the viewport origin', () => {
    expect(mapToClientPoint({ x: 47, y: 22 }, camera, 2, { left: 100, top: 50 })).toEqual({ x: 120, y: 70 });
  });

  it('positions the sprite on the map pixel grid', () => {
    expect(getSpriteTranslation({ x: 10.4, y: 20.6 }, { x: 3, y: 5 }, 2)).toEqual({ x: 14, y: 32 });
  });

  it('matches plain rounding at zoom 1', () => {
    const point = { x: 104.5, y: 77.49 };
    expect(getSpriteTranslation(point, { x: 0, y: 0 }, 1)).toEqual({ x: Math.round(104.5), y: 77 });
  });
});
