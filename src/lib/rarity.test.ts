import { describe, it, expect } from 'vitest';
import {
  rollRarity,
  scaleStat,
  getRarityMultiplier,
  getRarityColor,
  getRarityLabel,
  getRarityOdds,
  canUpgradeRarity,
  upgradeRarity,
  nextPity,
} from './rarity';
import { RARITY_TIERS, RARITY_STAT_MULTIPLIER, RARITY_COLORS, RARITY_LABELS, PITY_MAX } from '~/constants/rarity';

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
    // Base weights are 55/22/10/9/4 (sum 100), so the ordering should hold comfortably
    // over 20k samples (rare 10 and epic 9 sit too close to compare reliably by sampling).
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

describe('getRarityOdds', () => {
  it('sums to ~100 and orders common highest, legendary lowest at bias 0', () => {
    const odds = getRarityOdds(0);
    const total = Object.values(odds).reduce((sum, pct) => sum + pct, 0);
    expect(total).toBeCloseTo(100, 5);
    // Base weights 55/22/10/9/4 → ordering common > uncommon > rare > epic > legendary.
    expect(odds.common).toBeGreaterThan(odds.uncommon);
    expect(odds.uncommon).toBeGreaterThan(odds.rare);
    expect(odds.rare).toBeGreaterThan(odds.epic);
    expect(odds.epic).toBeGreaterThan(odds.legendary);
  });

  it('a positive bias raises the legendary chance', () => {
    expect(getRarityOdds(5).legendary).toBeGreaterThan(getRarityOdds(0).legendary);
  });
});

describe('upgradeRarity / canUpgradeRarity', () => {
  it('advances one tier', () => {
    expect(upgradeRarity('common')).toBe('uncommon');
    expect(upgradeRarity('rare')).toBe('epic');
  });

  it('caps at legendary', () => {
    expect(canUpgradeRarity('legendary')).toBe(false);
    expect(upgradeRarity('legendary')).toBe('legendary');
    expect(canUpgradeRarity('epic')).toBe(true);
  });
});

describe('nextPity', () => {
  it('increments when the roll is below the reset tier (rare)', () => {
    expect(nextPity(0, 'common')).toBe(1);
    expect(nextPity(3, 'uncommon')).toBe(4);
  });

  it('resets when the roll is at or above the reset tier', () => {
    expect(nextPity(7, 'rare')).toBe(0);
    expect(nextPity(7, 'legendary')).toBe(0);
  });

  it('clamps to PITY_MAX', () => {
    expect(nextPity(PITY_MAX, 'common')).toBe(PITY_MAX);
  });
});

describe('scaleStat', () => {
  it('scales and rounds positive values', () => {
    expect(scaleStat(5, 1.25)).toBe(6); // 6.25 -> 6
    expect(scaleStat(10, 1.6)).toBe(16);
  });

  it('guarantees at least +1 above base when the multiplier is > 1 (no dead-zone)', () => {
    expect(scaleStat(3, 1.1)).toBe(4); // round(3.3)=3, bumped to 4
    expect(scaleStat(1, 1.1)).toBe(2);
  });

  it('leaves stats unchanged at common (multiplier 1)', () => {
    expect(scaleStat(3, 1.0)).toBe(3);
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
