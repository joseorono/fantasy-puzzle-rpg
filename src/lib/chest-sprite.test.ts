import { describe, expect, it } from 'vitest';
import {
  getChestFrameRect,
  getChestIdleFrame,
  getChestIdleOffset,
  getChestOpenedFrame,
  getChestSheetRow,
  resolveChestVariant,
} from './chest-sprite';
import { CHEST_IDLE_FRAME_MS, CHEST_IDLE_HOLD_MS, CHEST_SPRITE_SHEET, DEFAULT_CHEST_VARIANT } from '~/constants/chest';

const { frameWidth, frameHeight, framesPerRow } = CHEST_SPRITE_SHEET;
const PLAY_MS = framesPerRow * CHEST_IDLE_FRAME_MS;
const CYCLE_MS = PLAY_MS + CHEST_IDLE_HOLD_MS;

describe('resolveChestVariant', () => {
  it('prefers the node, then the map, then the default', () => {
    expect(resolveChestVariant({ chestVariant: 'frost' }, { chestVariant: 'royal' })).toBe('royal');
    expect(resolveChestVariant({ chestVariant: 'frost' }, {})).toBe('frost');
    expect(resolveChestVariant({}, {})).toBe(DEFAULT_CHEST_VARIANT);
  });

  it('defaults to the first variant on the sheet', () => {
    expect(getChestSheetRow(DEFAULT_CHEST_VARIANT, 'idle')).toBe(0);
  });
});

describe('getChestSheetRow', () => {
  it('gives each variant an idle row followed by its open row', () => {
    expect(getChestSheetRow('wood', 'idle')).toBe(0);
    expect(getChestSheetRow('wood', 'open')).toBe(1);
    expect(getChestSheetRow('ebony', 'idle')).toBe(2);
    expect(getChestSheetRow('royal', 'open')).toBe(5);
    expect(getChestSheetRow('frost', 'open')).toBe(7);
  });
});

describe('getChestFrameRect', () => {
  it('locates a frame by variant, row and column', () => {
    expect(getChestFrameRect('royal', 'idle', 2)).toEqual({
      x: 2 * frameWidth,
      y: 4 * frameHeight,
      width: frameWidth,
      height: frameHeight,
    });
  });

  it('clamps the column to the row', () => {
    expect(getChestFrameRect('wood', 'open', 99).x).toBe((framesPerRow - 1) * frameWidth);
    expect(getChestFrameRect('wood', 'open', -3).x).toBe(0);
  });

  it('rests a looted chest on the open row’s last frame', () => {
    expect(getChestOpenedFrame()).toBe(framesPerRow - 1);
  });
});

describe('getChestIdleFrame', () => {
  it('steps through the row once', () => {
    expect(getChestIdleFrame(0)).toBe(0);
    expect(getChestIdleFrame(CHEST_IDLE_FRAME_MS)).toBe(1);
    expect(getChestIdleFrame(PLAY_MS - 1)).toBe(framesPerRow - 1);
  });

  it('rests on frame 0 through the hold, then plays again', () => {
    expect(getChestIdleFrame(PLAY_MS)).toBe(0);
    expect(getChestIdleFrame(CYCLE_MS - 1)).toBe(0);
    expect(getChestIdleFrame(CYCLE_MS + CHEST_IDLE_FRAME_MS)).toBe(1);
  });

  it('shifts the cycle by the offset, negative ones included', () => {
    expect(getChestIdleFrame(0, CHEST_IDLE_FRAME_MS * 2)).toBe(2);
    expect(getChestIdleFrame(0, -CYCLE_MS + CHEST_IDLE_FRAME_MS)).toBe(1);
  });

  it('gives neighbouring tiles different offsets', () => {
    expect(getChestIdleOffset({ row: 3, col: 4 })).not.toBe(getChestIdleOffset({ row: 3, col: 5 }));
  });
});
