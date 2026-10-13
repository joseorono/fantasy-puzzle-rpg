import { describe, it, expect } from 'vitest';
import {
  getAdmurinAnimationCycleMs,
  getAdmurinAnimationOrigin,
  getAdmurinAnimationZoom,
  getAdmurinPlacement,
  getAdmurinSheetRowCount,
  resolveAdmurinAttackAnimation,
} from './admurin-enemy-sheet';
import type { AdmurinEnemyAnimation, AdmurinEnemySheet } from '~/types/admurin-enemies';

const animation = (overrides: Partial<AdmurinEnemyAnimation> = {}): AdmurinEnemyAnimation => ({
  row: 0,
  frames: 5,
  frameDurationMs: 150,
  source: 'idle',
  rect: { x: 0, y: 0, width: 72, height: 59 },
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

describe('getAdmurinAnimationZoom', () => {
  const sheet = { cellH: 128, animations: { idle: animation({ rect: { x: 0, y: 0, width: 72, height: 59 } }) } };

  it('fits the animation inside the card, padding included', () => {
    // Frog idle body 72x59: the body fills ~84% of the card.
    expect(getAdmurinAnimationZoom(sheet, { rect: { x: 0, y: 0, width: 72, height: 59 } })).toBeCloseTo(
      (128 / 72) * 0.84,
    );
  });

  it('floors the shrink so a long attack does not turn the enemy into a dot', () => {
    const idleZoom = (128 / 72) * 0.84;
    // A pure fit of the 228px spit would be ~0.47; the floor keeps it at 60% of the idle zoom.
    expect(getAdmurinAnimationZoom(sheet, { rect: { x: 0, y: 0, width: 228, height: 63 } })).toBeCloseTo(
      idleZoom * 0.6,
    );
    // A gentle pose (a badger-like 105px idle and a 132px attack) fits exactly, above the floor.
    const badgerSheet = {
      cellH: 128,
      animations: { idle: animation({ rect: { x: 0, y: 0, width: 105, height: 49 } }) },
    };
    expect(getAdmurinAnimationZoom(badgerSheet, { rect: { x: 0, y: 0, width: 132, height: 73 } })).toBeCloseTo(
      (128 / 132) * 0.84,
    );
  });

  it('never divides by a zero rect', () => {
    expect(getAdmurinAnimationZoom(sheet, { rect: { x: 0, y: 0, width: 0, height: 0 } })).toBe(1);
  });
});

describe('getAdmurinPlacement', () => {
  it("centres the animation's own content on the card", () => {
    const sheet: Pick<AdmurinEnemySheet, 'cellW' | 'cellH' | 'animations'> = {
      cellW: 384,
      cellH: 128,
      animations: { idle: animation({ rect: { x: 156, y: 69, width: 72, height: 59 } }) },
    };

    const idle = getAdmurinPlacement(sheet, sheet.animations.idle);
    expect(idle.centerXPercent).toBeCloseTo(50);
    expect(idle.centerYPercent).toBeCloseTo(((69 + 59 / 2) / 128) * 100);

    // The spit's content reaches right, so its centre sits right of the body — the pose is centred.
    const spit = getAdmurinPlacement(sheet, animation({ rect: { x: 154, y: 65, width: 228, height: 63 } }));
    expect(spit.centerXPercent).toBeCloseTo(((154 + 114) / 384) * 100);
    expect(spit.zoom).toBeLessThan(idle.zoom);
  });
});
