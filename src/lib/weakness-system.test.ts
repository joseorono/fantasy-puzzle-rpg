import { describe, expect, it } from 'vitest';
import { WEAKNESS_DAMAGE_BONUS } from '~/constants/battle';
import { getWeaknessSource, isWeakTo, resolveWeaknessDamage, resolveWeaknessHits } from './weakness-system';

describe('getWeaknessSource', () => {
  it('reports the colour a hit exploited', () => {
    expect(getWeaknessSource(['green'], { color: 'green', kind: 'match' })).toBe('green');
    expect(getWeaknessSource(['green'], { color: 'green', kind: 'ultimate' })).toBe('green');
  });

  it("reports 'ultimate' for an Ultimate, even when its colour also matches", () => {
    expect(getWeaknessSource(['ultimate'], { color: 'blue', kind: 'ultimate' })).toBe('ultimate');
    expect(getWeaknessSource(['purple', 'ultimate'], { color: 'purple', kind: 'ultimate' })).toBe('ultimate');
  });

  it('is null when the hit exploits nothing', () => {
    expect(getWeaknessSource(['ultimate'], { color: 'blue', kind: 'match' })).toBeNull();
    expect(getWeaknessSource(['green'], { color: 'blue', kind: 'match' })).toBeNull();
    expect(getWeaknessSource(undefined, { color: 'green', kind: 'match' })).toBeNull();
  });
});

describe('isWeakTo', () => {
  it('matches a colour weakness on matches and Ultimates alike', () => {
    expect(isWeakTo(['green'], { color: 'green', kind: 'match' })).toBe(true);
    expect(isWeakTo(['green'], { color: 'green', kind: 'ultimate' })).toBe(true);
    expect(isWeakTo(['green'], { color: 'blue', kind: 'match' })).toBe(false);
  });

  it("matches an 'ultimate' weakness on any hero's Ultimate, never on matches", () => {
    expect(isWeakTo(['ultimate'], { color: 'blue', kind: 'ultimate' })).toBe(true);
    expect(isWeakTo(['ultimate'], { color: 'purple', kind: 'ultimate' })).toBe(true);
    expect(isWeakTo(['ultimate'], { color: 'blue', kind: 'match' })).toBe(false);
  });

  it('is false without weaknesses or without a colour to match', () => {
    expect(isWeakTo(undefined, { color: 'green', kind: 'match' })).toBe(false);
    expect(isWeakTo([], { color: 'green', kind: 'ultimate' })).toBe(false);
    expect(isWeakTo(['green'], { kind: 'match' })).toBe(false);
  });

  it('keys gray hits off the orb colour, though no hero owns it', () => {
    expect(isWeakTo(['gray'], { color: 'gray', kind: 'match' })).toBe(true);
  });
});

describe('resolveWeaknessDamage', () => {
  it('adds the bonus, rounded, only when weak', () => {
    expect(resolveWeaknessDamage(33, true)).toBe(Math.round(33 * (1 + WEAKNESS_DAMAGE_BONUS)));
    expect(resolveWeaknessDamage(33, false)).toBe(33);
  });

  it('applies once when both the colour and the kind match', () => {
    const isWeak = isWeakTo(['purple', 'ultimate'], { color: 'purple', kind: 'ultimate' });
    expect(resolveWeaknessDamage(40, isWeak)).toBe(Math.round(40 * (1 + WEAKNESS_DAMAGE_BONUS)));
  });
});

describe('resolveWeaknessHits', () => {
  it('boosts only the hits of a weak colour and reports which colour', () => {
    const hits = [
      { amount: 20, orbType: 'blue' as const },
      { amount: 20, orbType: 'green' as const },
    ];
    const result = resolveWeaknessHits(hits, ['green']);

    expect(result.weakSource).toBe('green');
    expect(result.hits.map((hit) => hit.amount)).toEqual([20, resolveWeaknessDamage(20, true)]);
  });

  it('returns the same array when nothing is weak', () => {
    const hits = [{ amount: 20, orbType: 'blue' as const }, { amount: 5 }];
    const result = resolveWeaknessHits(hits, ['green']);

    expect(result.weakSource).toBeNull();
    expect(result.hits).toBe(hits);
  });
});
