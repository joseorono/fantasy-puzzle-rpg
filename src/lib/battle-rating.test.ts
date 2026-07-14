import { expect, test, describe } from 'vitest';
import {
  computeBattleRating,
  getLootMultiplier,
  formatClearTime,
  formatThousands,
  type BattleRatingInput,
} from './battle-rating';
import {
  TIME_FULL_MS,
  TIME_ZERO_MS,
  SCORE_TARGET,
  COMBO_TARGET,
  MAX_ITEM_PENALTY,
  ITEM_PENALTY_PER_USE,
} from '~/constants/battle-rating';

// A fast, flawless, no-item clear — everything maxed.
const perfectRun: BattleRatingInput = {
  elapsedMs: 10_000, // under TIME_FULL_MS → full time
  score: SCORE_TARGET * 2, // >= target → full
  maxCombo: COMBO_TARGET * 2, // >= target → full
  hpRemainingPct: 1,
  itemsUsed: 0,
};

// A slow, nearly-dead, item-heavy clear — everything poor.
const poorRun: BattleRatingInput = {
  elapsedMs: TIME_ZERO_MS + 30_000, // over cap → zero time
  score: 0,
  maxCombo: 1,
  hpRemainingPct: 0.05,
  itemsUsed: 5,
};

describe('formatClearTime', () => {
  test('formats as M:SS with zero-padded seconds', () => {
    expect(formatClearTime(42_000)).toBe('0:42');
    expect(formatClearTime(125_000)).toBe('2:05');
    expect(formatClearTime(0)).toBe('0:00');
  });

  test('never goes negative', () => {
    expect(formatClearTime(-5000)).toBe('0:00');
  });
});

describe('formatThousands', () => {
  test('inserts separators', () => {
    expect(formatThousands(12_480)).toBe('12,480');
    expect(formatThousands(500)).toBe('500');
    expect(formatThousands(1_000_000)).toBe('1,000,000');
  });
});

describe('computeBattleRating — extremes', () => {
  test('a fast, flawless, no-item clear earns the max 5 stars', () => {
    const result = computeBattleRating(perfectRun);
    expect(result.stars).toBe(5);
    expect(result.normalized).toBeCloseTo(1, 5);
  });

  test('a slow, low-HP, item-heavy clear earns 1 star', () => {
    const result = computeBattleRating(poorRun);
    expect(result.stars).toBe(1);
  });

  test('you always earn at least 1 star for winning', () => {
    const worst = computeBattleRating({
      elapsedMs: 10_000_000,
      score: 0,
      maxCombo: 0,
      hpRemainingPct: 0,
      itemsUsed: 99,
    });
    expect(worst.stars).toBeGreaterThanOrEqual(1);
    expect(worst.normalized).toBe(0);
  });
});

describe('computeBattleRating — monotonicity', () => {
  const base: BattleRatingInput = {
    elapsedMs: 60_000,
    score: 1_500,
    maxCombo: 3,
    hpRemainingPct: 0.6,
    itemsUsed: 1,
  };

  test('using more items never raises the rating', () => {
    const few = computeBattleRating({ ...base, itemsUsed: 0 }).normalized;
    const more = computeBattleRating({ ...base, itemsUsed: 2 }).normalized;
    const most = computeBattleRating({ ...base, itemsUsed: 6 }).normalized;
    expect(more).toBeLessThanOrEqual(few);
    expect(most).toBeLessThanOrEqual(more);
  });

  test('keeping more HP never lowers the rating', () => {
    const low = computeBattleRating({ ...base, hpRemainingPct: 0.2 }).normalized;
    const high = computeBattleRating({ ...base, hpRemainingPct: 0.9 }).normalized;
    expect(high).toBeGreaterThanOrEqual(low);
  });

  test('a faster clear never lowers the rating', () => {
    const slow = computeBattleRating({ ...base, elapsedMs: 120_000 }).normalized;
    const fast = computeBattleRating({ ...base, elapsedMs: 20_000 }).normalized;
    expect(fast).toBeGreaterThanOrEqual(slow);
  });
});

describe('computeBattleRating — RNG criteria are weighted low', () => {
  test('maxing only score+combo (RNG) with poor skill stats cannot reach 3 stars', () => {
    const rngOnly = computeBattleRating({
      elapsedMs: TIME_ZERO_MS, // zero time
      score: SCORE_TARGET * 10, // maxed
      maxCombo: COMBO_TARGET * 10, // maxed
      hpRemainingPct: 0, // no HP
      itemsUsed: 0,
    });
    // score+combo weights sum to 0.2 → well under the 2-star (0.5) cutoff.
    expect(rngOnly.normalized).toBeCloseTo(0.2, 5);
    expect(rngOnly.stars).toBe(1);
  });
});

describe('computeBattleRating — penalty + breakdown', () => {
  test('the items penalty is capped', () => {
    const capReached = Math.ceil(MAX_ITEM_PENALTY / ITEM_PENALTY_PER_USE);
    const a = computeBattleRating({ ...perfectRun, itemsUsed: capReached });
    const b = computeBattleRating({ ...perfectRun, itemsUsed: capReached + 20 });
    // Beyond the cap, extra items don't lower the score further.
    expect(a.normalized).toBeCloseTo(b.normalized, 5);
    // Perfect positive (1.0) minus the max penalty.
    expect(b.normalized).toBeCloseTo(1 - MAX_ITEM_PENALTY, 5);
  });

  test('breakdown has all five criteria, items is the only penalty', () => {
    const { criteria } = computeBattleRating(perfectRun);
    expect(criteria.map((c) => c.key)).toEqual(['time', 'hp', 'combo', 'score', 'items']);
    expect(criteria.filter((c) => c.isPenalty).map((c) => c.key)).toEqual(['items']);
    expect(criteria.filter((c) => c.isRngHeavy).map((c) => c.key)).toEqual(['combo', 'score']);
  });

  test('the items row reports negative points when items were used', () => {
    const withItems = computeBattleRating({ ...perfectRun, itemsUsed: 2 });
    const itemsRow = withItems.criteria.find((c) => c.key === 'items')!;
    expect(itemsRow.points).toBeLessThan(0);
    expect(itemsRow.displayValue).toBe('2');
  });

  test('flawless flag set only when HP is full', () => {
    const flawless = computeBattleRating(perfectRun).criteria.find((c) => c.key === 'hp')!;
    const hurt = computeBattleRating({ ...perfectRun, hpRemainingPct: 0.5 }).criteria.find(
      (c) => c.key === 'hp',
    )!;
    expect(flawless.isFlawless).toBe(true);
    expect(hurt.isFlawless).toBe(false);
  });

  test('displayValue formatting for each criterion', () => {
    const { criteria } = computeBattleRating({
      elapsedMs: 42_000,
      score: 1_240,
      maxCombo: 4,
      hpRemainingPct: 0.88,
      itemsUsed: 3,
    });
    const byKey = Object.fromEntries(criteria.map((c) => [c.key, c.displayValue]));
    expect(byKey.time).toBe('0:42');
    expect(byKey.score).toBe('1,240');
    expect(byKey.combo).toBe('x4');
    expect(byKey.hp).toBe('88%');
    expect(byKey.items).toBe('3');
  });
});

describe('getLootMultiplier', () => {
  test('maps each star tier to its multiplier (1★ baseline, 5★ double)', () => {
    expect(getLootMultiplier(1)).toBe(1.0);
    expect(getLootMultiplier(3)).toBe(1.25);
    expect(getLootMultiplier(5)).toBe(2.0);
  });

  test('never decreases as stars increase', () => {
    for (let s = 2; s <= 5; s++) {
      expect(getLootMultiplier(s)).toBeGreaterThanOrEqual(getLootMultiplier(s - 1));
    }
  });

  test('unmapped star counts fall back to 1 (no bonus)', () => {
    expect(getLootMultiplier(0)).toBe(1);
    expect(getLootMultiplier(99)).toBe(1);
  });

  test('computeBattleRating.lootMultiplier matches getLootMultiplier(stars)', () => {
    const perfect = computeBattleRating(perfectRun);
    expect(perfect.stars).toBe(5);
    expect(perfect.lootMultiplier).toBe(getLootMultiplier(5));

    const poor = computeBattleRating(poorRun);
    expect(poor.lootMultiplier).toBe(getLootMultiplier(poor.stars));
  });
});

describe('computeBattleRating — star boundaries (1–5)', () => {
  // Each case lands normalized exactly on a threshold; stars = 1 + (# thresholds cleared).
  // Thresholds: [0.30, 0.52, 0.72, 0.90].

  test('normalized 0.30 → 2 stars (time zero, HP 0.75 → 0.4*0.75)', () => {
    const result = computeBattleRating({
      elapsedMs: TIME_ZERO_MS, // subTime 0
      score: 0,
      maxCombo: 0,
      hpRemainingPct: 0.75, // 0.4 * 0.75 = 0.30
      itemsUsed: 0,
    });
    expect(result.normalized).toBeCloseTo(0.3, 5);
    expect(result.stars).toBe(2);
  });

  test('normalized 0.52 → 3 stars (time full + HP 0.30)', () => {
    const result = computeBattleRating({
      elapsedMs: TIME_FULL_MS, // subTime 1 → 0.40
      score: 0,
      maxCombo: 0,
      hpRemainingPct: 0.3, // 0.4 * 0.30 = 0.12
      itemsUsed: 0,
    });
    expect(result.normalized).toBeCloseTo(0.52, 5);
    expect(result.stars).toBe(3);
  });

  test('normalized 0.72 → 4 stars (time full + HP 0.80)', () => {
    const result = computeBattleRating({
      elapsedMs: TIME_FULL_MS, // 0.40
      score: 0,
      maxCombo: 0,
      hpRemainingPct: 0.8, // 0.4 * 0.80 = 0.32
      itemsUsed: 0,
    });
    expect(result.normalized).toBeCloseTo(0.72, 5);
    expect(result.stars).toBe(4);
  });

  test('normalized 0.90 → 5 stars (time full + full HP + full score)', () => {
    const result = computeBattleRating({
      elapsedMs: TIME_FULL_MS, // 0.40
      score: SCORE_TARGET, // 0.10
      maxCombo: 0,
      hpRemainingPct: 1, // 0.40
      itemsUsed: 0,
    });
    expect(result.normalized).toBeCloseTo(0.9, 5);
    expect(result.stars).toBe(5);
  });

  test('just below the first threshold stays at 1 star', () => {
    const result = computeBattleRating({
      elapsedMs: TIME_ZERO_MS,
      score: 0,
      maxCombo: 0,
      hpRemainingPct: 0.7, // 0.28 < 0.30
      itemsUsed: 0,
    });
    expect(result.stars).toBe(1);
  });
});
