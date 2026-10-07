import { describe, expect, it } from 'vitest';
import { getMarkerAtlasExtraFrame, getMarkerAtlasFrame, getPlatePixelRole, isShadowPixel } from './map-marker-atlas';
import type { PixelRect } from '~/types/geometry';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { MarkerAtlasExtra } from '~/types/map';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';
import {
  MAP_MARKER_CHECK,
  MAP_MARKER_PLATE_SIZE_PX,
  MAP_MARKER_SHADOW,
  MAP_NODE_MARKER_STATES,
  MAP_NODE_MARKER_STYLES,
} from '~/constants/map';

const SIZE = MAP_MARKER_PLATE_SIZE_PX;
const LAST = SIZE - 1;
const FRAME = SIZE + MAP_MARKER_CHECK.overhangPx;
const TYPES = Object.keys(MAP_NODE_MARKER_STYLES) as MapNodeType[];
const EXTRAS: MarkerAtlasExtra[] = ['floorLoot', 'dialogueTrigger', 'plateShadow', 'floatShadow'];

function overlaps(a: PixelRect, b: PixelRect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// ---------------------------------------------------------------------------
// Plate pixels
// ---------------------------------------------------------------------------

describe('getPlatePixelRole', () => {
  it('clips the four outer corners', () => {
    for (const [x, y] of [
      [0, 0],
      [LAST, 0],
      [0, LAST],
      [LAST, LAST],
    ]) {
      expect(getPlatePixelRole(x, y, SIZE)).toBeNull();
    }
  });

  it('rings the plate with a 1px outline and rounds the inner corners', () => {
    for (let i = 1; i < LAST; i++) {
      expect(getPlatePixelRole(i, 0, SIZE)).toBe('outline');
      expect(getPlatePixelRole(i, LAST, SIZE)).toBe('outline');
      expect(getPlatePixelRole(0, i, SIZE)).toBe('outline');
      expect(getPlatePixelRole(LAST, i, SIZE)).toBe('outline');
    }
    expect(getPlatePixelRole(1, 1, SIZE)).toBe('outline');
    expect(getPlatePixelRole(LAST - 1, LAST - 1, SIZE)).toBe('outline');
  });

  it('lights the top band and shades the bottom band', () => {
    expect(getPlatePixelRole(5, 1, SIZE)).toBe('highlight');
    expect(getPlatePixelRole(1, 2, SIZE)).toBe('highlight');
    expect(getPlatePixelRole(5, 2, SIZE)).toBe('fill');
    expect(getPlatePixelRole(5, LAST - 2, SIZE)).toBe('shade');
    expect(getPlatePixelRole(5, LAST - 1, SIZE)).toBe('shade');
    expect(getPlatePixelRole(5, LAST - 3, SIZE)).toBe('fill');
  });

  it('is left-right symmetric', () => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        expect(getPlatePixelRole(x, y, SIZE)).toBe(getPlatePixelRole(LAST - x, y, SIZE));
      }
    }
  });
});

describe('isShadowPixel', () => {
  const width = MAP_MARKER_SHADOW.plateWidth;

  it('fills the middle row edge to edge and insets the outer rows', () => {
    expect(isShadowPixel(0, 1, width)).toBe(true);
    expect(isShadowPixel(width - 1, 1, width)).toBe(true);
    expect(isShadowPixel(1, 0, width)).toBe(false);
    expect(isShadowPixel(2, 0, width)).toBe(true);
    expect(isShadowPixel(width - 2, 2, width)).toBe(false);
  });

  it('is empty outside its rect', () => {
    expect(isShadowPixel(-1, 1, width)).toBe(false);
    expect(isShadowPixel(width, 1, width)).toBe(false);
    expect(isShadowPixel(5, MAP_MARKER_SHADOW.height, width)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Atlas layout
// ---------------------------------------------------------------------------

describe('getMarkerAtlasFrame', () => {
  it('lays node types out in rows and states in columns', () => {
    expect(getMarkerAtlasFrame(TYPES[0], 'todo')).toEqual({ x: 0, y: 0, width: FRAME, height: FRAME });
    expect(getMarkerAtlasFrame(TYPES[1], MAP_NODE_MARKER_STATES[2])).toEqual({
      x: 2 * FRAME,
      y: FRAME,
      width: FRAME,
      height: FRAME,
    });
  });

  it('gives every sprite its own space', () => {
    const frames = [
      ...TYPES.flatMap((type) => MAP_NODE_MARKER_STATES.map((state) => getMarkerAtlasFrame(type, state))),
      ...EXTRAS.map(getMarkerAtlasExtraFrame),
    ];
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        expect(overlaps(frames[i], frames[j])).toBe(false);
      }
    }
  });
});

describe('getMarkerAtlasExtraFrame', () => {
  it('puts the extras in a row below the node markers', () => {
    for (const extra of EXTRAS) {
      expect(getMarkerAtlasExtraFrame(extra).y).toBe(TYPES.length * FRAME);
    }
  });

  it('sizes symbols to a sheet cell and shadows to their widths', () => {
    expect(getMarkerAtlasExtraFrame('floorLoot').width).toBe(JIRBY_SYMBOL_SHEET.cellSize);
    expect(getMarkerAtlasExtraFrame('plateShadow').width).toBe(MAP_MARKER_SHADOW.plateWidth);
    expect(getMarkerAtlasExtraFrame('floatShadow').width).toBe(MAP_MARKER_SHADOW.floatWidth);
  });

  it('fits within the node-marker columns', () => {
    for (const extra of EXTRAS) {
      const frame = getMarkerAtlasExtraFrame(extra);
      expect(frame.x + frame.width).toBeLessThanOrEqual(MAP_NODE_MARKER_STATES.length * FRAME);
    }
  });
});
