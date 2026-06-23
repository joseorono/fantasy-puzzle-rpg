import { describe, it, expect } from 'vitest';
import { rollRarity, scaleStat, getRarityMultiplier, getRarityColor, getRarityLabel } from './rarity';
import { RARITY_TIERS, RARITY_STAT_MULTIPLIER, RARITY_COLORS, RARITY_LABELS } from '~/constants/rarity';

const tierIndex = (tier: string) => RARITY_TIERS.indexOf(tier as (typeof RARITY_TIERS)[number]);

describe('rollRarity', () => {
  it('only ever returns a valid tier', () => {
    for (let i = 0; i < 2000; i++) {
      expect(RARITY_TIERS).toContain(rollRarity());
    }
  });

  it('with bias 0 favors common most and legendary least', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const tier = rollRarity(0);
      counts[tier] = (counts[tier] ?? 0) + 1;
    }
    // Base weights are 60/25/10/4/1, so the ordering should hold comfortably over 20k samples.
    expect(counts.common).toBeGreaterThan(counts.uncommon);
    expect(counts.uncommon).toBeGreaterThan(counts.rare);
    expect(counts.rare ?? 0).toBeGreaterThan(counts.legendary ?? 0);
  });

  it('a positive bias raises the average rolled tier', () => {
    const meanIndex = (bias: number) => {
      let sum = 0;
      const samples = 20000;
      for (let i = 0; i < samples; i++) sum += tierIndex(rollRarity(bias));
      return sum / samples;
    };
    expect(meanIndex(5)).toBeGreaterThan(meanIndex(0));
  });
});

describe('scaleStat', () => {
  it('scales and rounds positive values', () => {
    expect(scaleStat(5, 1.25)).toBe(6); // 6.25 -> 6
    expect(scaleStat(10, 1.6)).toBe(16);
  });

  it('leaves zero and negative penalties untouched', () => {
    expect(scaleStat(0, 1.6)).toBe(0);
    expect(scaleStat(-2, 1.6)).toBe(-2);
  });
});

describe('rarity lookups', () => {
  it('default to common when rarity is undefined', () => {
    expect(getRarityMultiplier(undefined)).toBe(RARITY_STAT_MULTIPLIER.common);
    expect(getRarityColor(undefined)).toBe(RARITY_COLORS.common);
    expect(getRarityLabel(undefined)).toBe(RARITY_LABELS.common);
  });

  it('resolve each tier', () => {
    expect(getRarityMultiplier('legendary')).toBe(RARITY_STAT_MULTIPLIER.legendary);
    expect(getRarityColor('rare')).toBe(RARITY_COLORS.rare);
    expect(getRarityLabel('epic')).toBe('Epic');
  });
});
