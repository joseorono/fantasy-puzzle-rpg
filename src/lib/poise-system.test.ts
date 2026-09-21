import { describe, it, expect } from 'vitest';
import {
  applyPoiseHits,
  calculateMaxPoise,
  calculatePoiseDamage,
  createEnemyPoiseState,
  describeEnemyPoise,
  formatEnemyPoise,
  isEnemyStaggered,
  isPoiseImmune,
  poiseSummariesMatch,
  resolveEscalatedMaxPoise,
  resolveStaggeredEnemySignature,
  resolveVulnerableDamage,
  resolveVulnerableHits,
  summarizeEnemyPoise,
  tickEnemyPoise,
} from './poise-system';
import type { EnemyPoiseState } from '~/types/battle';
import {
  POISE_BREAK_DAMAGE_BONUS,
  POISE_BREAK_IMMUNITY_MS,
  POISE_BREAK_STAGGER_DURATION_MS,
  POISE_MAX_GROWTH_CAP,
  POISE_MAX_GROWTH_PER_BREAK,
  POISE_POOL_HP_FRACTION,
  POISE_REGEN_PER_SECOND,
} from '~/constants/battle';

const golem = { maxHp: 400 };
const frog = { maxHp: 68 };

function makeState(overrides: Partial<EnemyPoiseState> = {}): EnemyPoiseState {
  return { ...createEnemyPoiseState(golem), ...overrides };
}

describe('calculateMaxPoise / createEnemyPoiseState', () => {
  it('scales the pool with max HP', () => {
    expect(calculateMaxPoise(golem)).toBe(400 * POISE_POOL_HP_FRACTION);
    expect(calculateMaxPoise(frog)).toBe(68 * POISE_POOL_HP_FRACTION);
    expect(calculateMaxPoise(golem)).toBeGreaterThan(calculateMaxPoise(frog));
  });

  it('seeds a full pool with no breaks and both windows closed', () => {
    const state = createEnemyPoiseState(golem);
    expect(state.current).toBe(state.max);
    expect(state.max).toBe(state.originalMax);
    expect(state.breakCount).toBe(0);
    expect(state.staggerRemainingMs).toBe(0);
    expect(state.immuneRemainingMs).toBe(0);
    expect(isEnemyStaggered(state)).toBe(false);
    expect(isPoiseImmune(state)).toBe(false);
  });
});

describe('calculatePoiseDamage', () => {
  it('is the hit amount at poise 1 with no multipliers', () => {
    expect(calculatePoiseDamage(20, 1, 1)).toBe(20);
  });

  it('halves at poise 0.5 and doubles at poise 2', () => {
    expect(calculatePoiseDamage(20, 0.5, 1)).toBe(10);
    expect(calculatePoiseDamage(20, 2, 1)).toBe(40);
  });

  it('folds in the hit multiplier (attacker passive × skill bonus)', () => {
    expect(calculatePoiseDamage(20, 1, 1.5)).toBe(30);
    expect(calculatePoiseDamage(20, 0.5, 3)).toBe(30);
  });

  it('adds the optional cascade bonus on top of the amount (off by default)', () => {
    // With POISE_CASCADE_BONUS_PER_LEVEL at 0 the cascade level is inert; the amount already
    // carries the combo multiplier.
    expect(calculatePoiseDamage(20, 1, 1, 3)).toBe(calculatePoiseDamage(20, 1, 1, 0));
    expect(calculatePoiseDamage(20, 1, 1, -2)).toBe(20);
  });

  it('never goes negative and ignores non-positive hits', () => {
    expect(calculatePoiseDamage(0, 1, 1)).toBe(0);
    expect(calculatePoiseDamage(-5, 1, 1)).toBe(0);
    expect(calculatePoiseDamage(5, 0, 1)).toBe(0);
  });
});

describe('resolveEscalatedMaxPoise', () => {
  it('grows 100% → 125% → 150% and then holds at the 150% cap', () => {
    expect(resolveEscalatedMaxPoise(100, 0)).toBe(100);
    expect(resolveEscalatedMaxPoise(100, 1)).toBe(100 * (1 + POISE_MAX_GROWTH_PER_BREAK));
    expect(resolveEscalatedMaxPoise(100, 2)).toBe(100 * POISE_MAX_GROWTH_CAP);
    expect(resolveEscalatedMaxPoise(100, 3)).toBe(100 * POISE_MAX_GROWTH_CAP);
    expect(resolveEscalatedMaxPoise(100, 50)).toBe(100 * POISE_MAX_GROWTH_CAP);
  });

  it('is relative to the original max, not the current one', () => {
    const original = calculateMaxPoise(golem);
    expect(resolveEscalatedMaxPoise(original, 99)).toBe(original * POISE_MAX_GROWTH_CAP);
  });

  it('treats a negative break count as zero', () => {
    expect(resolveEscalatedMaxPoise(100, -1)).toBe(100);
  });
});

describe('applyPoiseHits', () => {
  it('subtracts poise damage and keeps everything else', () => {
    const state = makeState();
    const { next, didBreak } = applyPoiseHits(state, [{ amount: 30, multiplier: 1 }], 1);
    expect(didBreak).toBe(false);
    expect(next).not.toBe(state);
    expect(next.current).toBe(state.max - 30);
    expect(next.max).toBe(state.max);
    expect(next.breakCount).toBe(0);
    expect(next.staggerRemainingMs).toBe(0);
  });

  it('applies the enemy poise multiplier in both directions', () => {
    const state = makeState();
    expect(applyPoiseHits(state, [{ amount: 30, multiplier: 1 }], 0.5).next.current).toBe(state.max - 15);
    expect(applyPoiseHits(state, [{ amount: 30, multiplier: 1 }], 2).next.current).toBe(state.max - 60);
  });

  it('resolves a multi-hit batch in order and breaks exactly once', () => {
    const state = makeState({ current: 50 });
    const hits = [
      { amount: 20, multiplier: 1 },
      { amount: 40, multiplier: 1 }, // this one empties the pool
      { amount: 999, multiplier: 1 }, // absorbed by the Break
    ];
    const { next, didBreak } = applyPoiseHits(state, hits, 1);
    expect(didBreak).toBe(true);
    expect(next.breakCount).toBe(1);
    expect(next.max).toBe(resolveEscalatedMaxPoise(state.originalMax, 1));
    expect(next.current).toBe(next.max);
    expect(next.staggerRemainingMs).toBe(POISE_BREAK_STAGGER_DURATION_MS);
    expect(next.immuneRemainingMs).toBe(0);
    expect(isEnemyStaggered(next)).toBe(true);
  });

  it('breaks on exact depletion', () => {
    const state = makeState({ current: 25 });
    expect(applyPoiseHits(state, [{ amount: 25, multiplier: 1 }], 1).didBreak).toBe(true);
  });

  it('returns the same reference while staggered (no accumulation, no double break)', () => {
    const state = makeState({ current: 1, staggerRemainingMs: 1000 });
    const result = applyPoiseHits(state, [{ amount: 500, multiplier: 1 }], 1);
    expect(result.next).toBe(state);
    expect(result.didBreak).toBe(false);
  });

  it('returns the same reference while immune', () => {
    const state = makeState({ current: 1, immuneRemainingMs: 500 });
    const result = applyPoiseHits(state, [{ amount: 500, multiplier: 1 }], 1);
    expect(result.next).toBe(state);
    expect(result.didBreak).toBe(false);
  });

  it('returns the same reference for an empty or zero-damage batch', () => {
    const state = makeState();
    expect(applyPoiseHits(state, [], 1).next).toBe(state);
    expect(applyPoiseHits(state, [{ amount: 0, multiplier: 1 }], 1).next).toBe(state);
  });

  it('escalates the max per break and caps at 150% of the original', () => {
    let state = makeState();
    const original = state.originalMax;
    const smash = [{ amount: original * 10, multiplier: 1 }];

    for (let breaks = 1; breaks <= 4; breaks++) {
      // Fast-forward through the stagger and immunity windows so the next hit counts.
      state = { ...state, staggerRemainingMs: 0, immuneRemainingMs: 0 };
      const { next, didBreak } = applyPoiseHits(state, smash, 1);
      expect(didBreak).toBe(true);
      expect(next.breakCount).toBe(breaks);
      expect(next.max).toBe(resolveEscalatedMaxPoise(original, breaks));
      expect(next.max).toBeLessThanOrEqual(original * POISE_MAX_GROWTH_CAP);
      expect(next.originalMax).toBe(original);
      state = next;
    }
    expect(state.max).toBe(original * POISE_MAX_GROWTH_CAP);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const snapshot = { ...state };
    applyPoiseHits(state, [{ amount: state.max * 2, multiplier: 1 }], 1);
    expect(state).toEqual(snapshot);
  });
});

describe('tickEnemyPoise', () => {
  it('returns the same record reference when every enemy is idle', () => {
    const record = { a: makeState(), b: createEnemyPoiseState(frog) };
    expect(tickEnemyPoise(record, 0.1)).toBe(record);
  });

  it('counts the stagger window down and keeps untouched enemies by reference', () => {
    const record = { a: makeState({ staggerRemainingMs: 1000 }), b: makeState() };
    const next = tickEnemyPoise(record, 0.1);
    expect(next).not.toBe(record);
    expect(next.a.staggerRemainingMs).toBeCloseTo(900, 6);
    expect(next.a.immuneRemainingMs).toBe(0);
    expect(next.b).toBe(record.b);
  });

  it('opens the immunity window in the tick that ends the stagger', () => {
    const record = { a: makeState({ staggerRemainingMs: 50 }) };
    const next = tickEnemyPoise(record, 0.1);
    expect(next.a.staggerRemainingMs).toBe(0);
    expect(next.a.immuneRemainingMs).toBe(POISE_BREAK_IMMUNITY_MS);
    expect(isEnemyStaggered(next.a)).toBe(false);
    expect(isPoiseImmune(next.a)).toBe(true);
  });

  it('counts the immunity window down to exactly 0 and then goes idle', () => {
    let record: Record<string, EnemyPoiseState> = { a: makeState({ immuneRemainingMs: 150 }) };
    record = tickEnemyPoise(record, 0.1);
    expect(record.a.immuneRemainingMs).toBeCloseTo(50, 6);
    record = tickEnemyPoise(record, 0.1);
    expect(record.a.immuneRemainingMs).toBe(0);
    expect(tickEnemyPoise(record, 0.1)).toBe(record);
  });

  it('walks a Break all the way: stagger → immunity → idle', () => {
    let record: Record<string, EnemyPoiseState> = {
      a: applyPoiseHits(makeState(), [{ amount: 9999, multiplier: 1 }], 1).next,
    };
    const totalMs = POISE_BREAK_STAGGER_DURATION_MS + POISE_BREAK_IMMUNITY_MS;
    for (let elapsed = 0; elapsed < totalMs; elapsed += 100) record = tickEnemyPoise(record, 0.1);
    expect(record.a.staggerRemainingMs).toBe(0);
    expect(record.a.immuneRemainingMs).toBe(0);
    expect(record.a.breakCount).toBe(1);
    expect(record.a.current).toBe(record.a.max);
  });

  it('leaves a dented pool exactly as it is when the rate is 0', () => {
    const record = { a: makeState({ current: 10 }) };
    expect(tickEnemyPoise(record, 1, 0)).toBe(record);
  });

  // Asserts the default is wired through, not what it is tuned to, so retuning the constant
  // (0 → 0.01 and back) never breaks this.
  it('uses POISE_REGEN_PER_SECOND when no rate is passed', () => {
    const record = { a: makeState({ current: 10 }) };
    expect(tickEnemyPoise(record, 1)).toEqual(tickEnemyPoise(record, 1, POISE_REGEN_PER_SECOND));
  });

  it('regenerates toward max (never past it) when a rate is given', () => {
    const state = makeState({ current: 10 });
    const next = tickEnemyPoise({ a: state }, 0.5, 0.1);
    expect(next.a.current).toBeCloseTo(10 + state.max * 0.1 * 0.5, 6);

    const nearlyFull = makeState({ current: makeState().max - 1 });
    expect(tickEnemyPoise({ a: nearlyFull }, 10, 0.5).a.current).toBe(nearlyFull.max);
  });

  it('does not regenerate while staggered', () => {
    const state = makeState({ current: 10, staggerRemainingMs: 1000 });
    expect(tickEnemyPoise({ a: state }, 0.1, 0.5).a.current).toBe(10);
  });

  it('does not mutate the input record or states', () => {
    const state = makeState({ staggerRemainingMs: 100 });
    const record = { a: state };
    tickEnemyPoise(record, 0.1);
    expect(record.a).toBe(state);
    expect(state.staggerRemainingMs).toBe(100);
  });
});

describe('resolveVulnerableDamage / resolveVulnerableHits', () => {
  it('leaves an unbroken target alone, hits array by reference', () => {
    const hits = [{ amount: 10 }, { amount: 7 }];
    expect(resolveVulnerableDamage(10, false)).toBe(10);
    expect(resolveVulnerableHits(hits, false)).toBe(hits);
  });

  it('boosts by the break bonus, rounded, keeping other hit fields', () => {
    const hits = [
      { amount: 10, characterId: 'w' },
      { amount: 7, characterId: undefined },
    ];
    const boosted = resolveVulnerableHits(hits, true);
    expect(boosted).not.toBe(hits);
    expect(boosted[0]).toEqual({ amount: Math.round(10 * (1 + POISE_BREAK_DAMAGE_BONUS)), characterId: 'w' });
    expect(boosted[1].amount).toBe(Math.round(7 * (1 + POISE_BREAK_DAMAGE_BONUS)));
    expect(resolveVulnerableDamage(7, true)).toBe(boosted[1].amount);
  });
});

describe('resolveStaggeredEnemySignature', () => {
  it('is empty when nobody is broken', () => {
    expect(resolveStaggeredEnemySignature({})).toBe('');
    expect(resolveStaggeredEnemySignature({ a: makeState(), b: makeState({ immuneRemainingMs: 5 }) })).toBe('');
  });

  it('lists broken ids in record order, pipe-joined', () => {
    const record = {
      a: makeState({ staggerRemainingMs: 10 }),
      b: makeState(),
      c: makeState({ staggerRemainingMs: 2500 }),
    };
    expect(resolveStaggeredEnemySignature(record)).toBe('a|c');
  });

  it('is stable across a countdown tick that does not end the window', () => {
    const record = { a: makeState({ staggerRemainingMs: 1000 }) };
    expect(resolveStaggeredEnemySignature(tickEnemyPoise(record, 0.1))).toBe(resolveStaggeredEnemySignature(record));
  });
});

describe('summarizeEnemyPoise / poiseSummariesMatch', () => {
  it('reads a fresh pool as ready, full, no window, no escalation mark', () => {
    expect(summarizeEnemyPoise(makeState())).toEqual({
      phase: 'ready',
      fillPercent: 100,
      windowPercent: 0,
      breakCount: 0,
      originalMaxPercent: null,
    });
  });

  it('rounds the remaining poise to an integer percent', () => {
    const state = makeState();
    expect(summarizeEnemyPoise({ ...state, current: state.max * 0.666 }).fillPercent).toBe(67);
    expect(summarizeEnemyPoise({ ...state, current: 0 }).fillPercent).toBe(0);
  });

  it('is broken while the stagger window runs, with the window as a percent of its full length', () => {
    const summary = summarizeEnemyPoise(makeState({ staggerRemainingMs: POISE_BREAK_STAGGER_DURATION_MS / 4 }));
    expect(summary.phase).toBe('broken');
    expect(summary.windowPercent).toBe(25);
    expect(summary.fillPercent).toBe(100);
  });

  it('is immune once the stagger ends, with the immunity window as a percent', () => {
    const summary = summarizeEnemyPoise(makeState({ immuneRemainingMs: POISE_BREAK_IMMUNITY_MS / 2 }));
    expect(summary.phase).toBe('immune');
    expect(summary.windowPercent).toBe(50);
  });

  it('marks where the original max sits once the pool has escalated', () => {
    const state = makeState();
    const broken = applyPoiseHits(state, [{ amount: state.max * 10, multiplier: 1 }], 1).next;
    const summary = summarizeEnemyPoise(broken);
    expect(summary.breakCount).toBe(1);
    expect(summary.originalMaxPercent).toBe(Math.round((100 * state.originalMax) / broken.max));
  });

  it('clamps out-of-range windows and a zero max instead of producing NaN', () => {
    expect(summarizeEnemyPoise(makeState({ max: 0, current: 0 })).fillPercent).toBe(0);
    expect(
      summarizeEnemyPoise(makeState({ staggerRemainingMs: POISE_BREAK_STAGGER_DURATION_MS * 3 })).windowPercent,
    ).toBe(100);
  });

  it('describes each phase for the bar title, with standby outranking the rest', () => {
    const ready = summarizeEnemyPoise(makeState({ current: makeState().max * 0.72 }));
    expect(describeEnemyPoise(ready)).toContain('72%');
    expect(describeEnemyPoise(ready, true)).toContain('starts attacking');
    expect(describeEnemyPoise(summarizeEnemyPoise(makeState({ staggerRemainingMs: 500 })))).toContain('Staggered');
    expect(describeEnemyPoise(summarizeEnemyPoise(makeState({ immuneRemainingMs: 500 })))).toContain('ignored');
  });

  it('formats the training readout: percent, break tally, then phase names', () => {
    expect(formatEnemyPoise(summarizeEnemyPoise(makeState()))).toBe('100%');
    expect(formatEnemyPoise(summarizeEnemyPoise(makeState({ staggerRemainingMs: 1 })))).toBe('BROKEN');
    expect(formatEnemyPoise(summarizeEnemyPoise(makeState({ immuneRemainingMs: 1 })))).toBe('IMMUNE');

    const escalated = applyPoiseHits(makeState(), [{ amount: 9999, multiplier: 1 }], 1).next;
    expect(formatEnemyPoise(summarizeEnemyPoise({ ...escalated, staggerRemainingMs: 0 }))).toBe('100% ×1');
  });

  it('matches two summaries only when every drawn field agrees', () => {
    const a = summarizeEnemyPoise(makeState());
    expect(poiseSummariesMatch(a, summarizeEnemyPoise(makeState()))).toBe(true);
    expect(poiseSummariesMatch(a, { ...a, fillPercent: 99 })).toBe(false);
    expect(poiseSummariesMatch(a, { ...a, phase: 'immune' })).toBe(false);
    expect(poiseSummariesMatch(a, { ...a, windowPercent: 1 })).toBe(false);
    expect(poiseSummariesMatch(a, { ...a, breakCount: 1 })).toBe(false);
    expect(poiseSummariesMatch(a, { ...a, originalMaxPercent: 80 })).toBe(false);
  });

  it('does not change across a regen tick that moves the pool by less than a percent', () => {
    const state = makeState({ current: makeState().max * 0.5 });
    const ticked = tickEnemyPoise({ a: state }, 0.1, 0.01).a;
    expect(ticked).not.toBe(state);
    expect(poiseSummariesMatch(summarizeEnemyPoise(state), summarizeEnemyPoise(ticked))).toBe(true);
  });
});
