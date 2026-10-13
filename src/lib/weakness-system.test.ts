import { describe, expect, it } from 'vitest';
import { WEAKNESS_DAMAGE_BONUS } from '~/constants/battle';
import { isWeakTo, resolveWeaknessDamage, resolveWeaknessHits } from './weakness-system';

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
  it('boosts only the hits of a weak colour and reports the batch as weak', () => {
    const hits = [
      { amount: 20, orbType: 'green' as const },
      { amount: 20, orbType: 'blue' as const },
    ];
    const result = resolveWeaknessHits(hits, ['green']);

    expect(result.isWeak).toBe(true);
    expect(result.hits.map((hit) => hit.amount)).toEqual([resolveWeaknessDamage(20, true), 20]);
  });

  it('returns the same array when nothing is weak', () => {
    const hits = [{ amount: 20, orbType: 'blue' as const }, { amount: 5 }];
    const result = resolveWeaknessHits(hits, ['green']);

    expect(result.isWeak).toBe(false);
    expect(result.hits).toBe(hits);
  });
});
