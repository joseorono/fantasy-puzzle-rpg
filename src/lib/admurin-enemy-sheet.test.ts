import { describe, it, expect } from 'vitest';
import {
  getAdmurinAnimationCycleMs,
  getAdmurinAnimationOrigin,
  getAdmurinDisplayZoom,
  getAdmurinSheetRowCount,
  resolveAdmurinAttackAnimation,
} from './admurin-enemy-sheet';
import type { AdmurinEnemyAnimation, AdmurinEnemySheet } from '~/types/admurin-enemies';

const animation = (overrides: Partial<AdmurinEnemyAnimation> = {}): AdmurinEnemyAnimation => ({
  row: 0,
  frames: 5,
  frameDurationMs: 150,
  source: 'idle',
  ...overrides,
});

const sheetWith = (attacks?: AdmurinEnemyAnimation[]): Pick<AdmurinEnemySheet, 'animations'> => ({
  animations: { idle: animation(), attacks },
});

describe('getAdmurinAnimationOrigin', () => {
  it('anchors every row to the left edge', () => {
    expect(getAdmurinAnimationOrigin({ cellH: 128 }, animation({ row: 0 }))).toEqual({ x: 0, y: 0 });
    expect(getAdmurinAnimationOrigin({ cellH: 128 }, animation({ row: 3 }))).toEqual({ x: 0, y: 384 });
  });
});

describe('getAdmurinAnimationCycleMs', () => {
  it('multiplies frames by the frame duration', () => {
    expect(getAdmurinAnimationCycleMs(animation({ frames: 5, frameDurationMs: 150 }))).toBe(750);
    expect(getAdmurinAnimationCycleMs(animation({ frames: 45, frameDurationMs: 45 }))).toBe(2025);
  });
});

describe('resolveAdmurinAttackAnimation', () => {
  it('returns undefined when the sheet has no attack rows', () => {
    expect(resolveAdmurinAttackAnimation(sheetWith(), 0)).toBeUndefined();
    expect(resolveAdmurinAttackAnimation(sheetWith([]), 0)).toBeUndefined();
  });

  it('picks the row that matches the attack index', () => {
    const a = animation({ row: 3, source: 'attack_a' });
    const b = animation({ row: 4, source: 'attack_b' });
    expect(resolveAdmurinAttackAnimation(sheetWith([a, b]), 0)).toBe(a);
    expect(resolveAdmurinAttackAnimation(sheetWith([a, b]), 1)).toBe(b);
  });

  it('wraps an out-of-range index', () => {
    const a = animation({ row: 3 });
    const b = animation({ row: 4 });
    expect(resolveAdmurinAttackAnimation(sheetWith([a, b]), 2)).toBe(a);
    expect(resolveAdmurinAttackAnimation(sheetWith([a, b]), 3)).toBe(b);
    expect(resolveAdmurinAttackAnimation(sheetWith([a]), 5)).toBe(a);
  });
});

describe('getAdmurinSheetRowCount', () => {
  it('counts one past the highest animation row', () => {
    const sheet: Pick<AdmurinEnemySheet, 'animations'> = {
      animations: {
        idle: animation({ row: 0 }),
        move: animation({ row: 1 }),
        hurt: animation({ row: 2 }),
        attacks: [animation({ row: 3 }), animation({ row: 4 })],
        ability: animation({ row: 5 }),
      },
    };
    expect(getAdmurinSheetRowCount(sheet)).toBe(6);
  });

  it('handles a sheet with only an idle row', () => {
    expect(getAdmurinSheetRowCount(sheetWith())).toBe(1);
  });
});

describe('getAdmurinDisplayZoom', () => {
  it("scales the cell so the character's longest side fills it", () => {
    // A 72x59 body inside a 128px cell (the Frogger idle) needs ~1.78x to reach the card edge.
    expect(getAdmurinDisplayZoom({ cellH: 128, characterRect: { x: 0, y: 0, width: 72, height: 59 } })).toBeCloseTo(
      128 / 72,
    );
    // A tall body scales by its height instead.
    expect(getAdmurinDisplayZoom({ cellH: 128, characterRect: { x: 0, y: 0, width: 40, height: 96 } })).toBeCloseTo(
      128 / 96,
    );
  });

  it('never divides by a zero rect', () => {
    expect(getAdmurinDisplayZoom({ cellH: 128, characterRect: { x: 0, y: 0, width: 0, height: 0 } })).toBe(1);
  });
});
