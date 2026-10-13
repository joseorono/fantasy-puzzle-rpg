import { expect, test, describe } from 'vitest';
import * as flinch from './flinch-system';
import type { CharacterData } from '~/types/rpg-elements';
import { MAX_STAGGER_FRACTION_PER_CYCLE, SKILL_STAGGER_MULTIPLIER } from '~/constants/battle';

describe('Stagger Calculations', () => {
  test('calculateStaggerPushMs: any real hit produces a positive push (everyone flinches)', () => {
    expect(flinch.calculateStaggerPushMs(50, 300, 50, 4000)).toBeGreaterThan(0);
    // Even a tiny hit on a very tanky enemy still flinches a little.
    expect(flinch.calculateStaggerPushMs(1, 9999, 999, 4000)).toBeGreaterThan(0);
  });

  test('calculateStaggerPushMs: zero/negative damage or interval yields no push', () => {
    expect(flinch.calculateStaggerPushMs(0, 300, 50, 4000)).toBe(0);
    expect(flinch.calculateStaggerPushMs(-10, 300, 50, 4000)).toBe(0);
    expect(flinch.calculateStaggerPushMs(50, 300, 50, 0)).toBe(0);
  });

  test('calculateStaggerPushMs: higher VIT resists (smaller push), monotonically', () => {
    const lowVit = flinch.calculateStaggerPushMs(50, 300, 10, 4000);
    const midVit = flinch.calculateStaggerPushMs(50, 300, 50, 4000);
    const highVit = flinch.calculateStaggerPushMs(50, 300, 100, 4000);
    expect(midVit).toBeLessThan(lowVit);
    expect(highVit).toBeLessThan(midVit);
  });

  test('calculateStaggerPushMs: scales with damage up to the reference, then plateaus', () => {
    const small = flinch.calculateStaggerPushMs(10, 300, 50, 4000);
    const bigger = flinch.calculateStaggerPushMs(40, 300, 50, 4000);
    expect(bigger).toBeGreaterThan(small);
    // reference = 300 * 0.15 = 45; hits at or above 45 all reach damageRatio = 1 and plateau.
    const atReference = flinch.calculateStaggerPushMs(45, 300, 50, 4000);
    const wayAbove = flinch.calculateStaggerPushMs(9999, 300, 50, 4000);
    expect(wayAbove).toBeCloseTo(atReference, 5);
  });

  test('clampStaggerToCycleBudget: a single push never exceeds the per-cycle cap', () => {
    // cap = 4000 * 0.12 = 480ms
    expect(flinch.clampStaggerToCycleBudget(10_000, 4000, 0)).toBe(480);
  });

  test('clampStaggerToCycleBudget: respects budget already spent, then zeroes out', () => {
    expect(flinch.clampStaggerToCycleBudget(1000, 4000, 300)).toBe(180); // 480 cap - 300 used
    expect(flinch.clampStaggerToCycleBudget(1000, 4000, 480)).toBe(0);
    expect(flinch.clampStaggerToCycleBudget(1000, 4000, 600)).toBe(0); // over-spent stays clamped
  });

  test('anti-stunlock: relentless huge hits can never push a cycle past the cap', () => {
    const interval = 4000;
    let used = 0;
    for (let i = 0; i < 25; i++) {
      const push = flinch.calculateStaggerPushMs(9999, 300, 50, interval);
      used += flinch.clampStaggerToCycleBudget(push, interval, used);
    }
    expect(used).toBeLessThanOrEqual(interval * 0.12 + 1e-9);
  });

  // Demo roster stats (src/constants/enemies/world-00): the tankiest and frailest enemies.
  const mossGolem = { maxHp: 400, vit: 70 };
  const swampFrog = { maxHp: 68, vit: 16 };
  const golemInterval = 4000;
  const frogInterval = 2608;

  test('resolveStaggerHits: an empty batch applies nothing and never maxes', () => {
    expect(flinch.resolveStaggerHits([], mossGolem, golemInterval, 0)).toEqual({ appliedMs: 0, maxedFlinch: false });
  });

  test('resolveStaggerHits: a single hit matches the standalone push', () => {
    const expected = flinch.calculateStaggerPushMs(13, mossGolem.maxHp, mossGolem.vit, golemInterval);
    const { appliedMs } = flinch.resolveStaggerHits([{ amount: 13, multiplier: 1 }], mossGolem, golemInterval, 0);
    expect(appliedMs).toBeCloseTo(expected, 6);
  });

  test('resolveStaggerHits: every hit in a batch counts (multi-color match regression)', () => {
    const one = flinch.resolveStaggerHits([{ amount: 13, multiplier: 1 }], mossGolem, golemInterval, 0);
    const two = flinch.resolveStaggerHits(
      [
        { amount: 13, multiplier: 1 },
        { amount: 16, multiplier: 1 },
      ],
      mossGolem,
      golemInterval,
      0,
    );
    expect(two.appliedMs).toBeGreaterThan(one.appliedMs);
    const separate =
      flinch.calculateStaggerPushMs(13, mossGolem.maxHp, mossGolem.vit, golemInterval) +
      flinch.calculateStaggerPushMs(16, mossGolem.maxHp, mossGolem.vit, golemInterval);
    expect(two.appliedMs).toBeCloseTo(separate, 6);
  });

  test('resolveStaggerHits: per-hit multipliers scale the push before the clamp', () => {
    const plain = flinch.resolveStaggerHits([{ amount: 13, multiplier: 1 }], mossGolem, golemInterval, 0);
    const boosted = flinch.resolveStaggerHits([{ amount: 13, multiplier: 2 }], mossGolem, golemInterval, 0);
    expect(boosted.appliedMs).toBeCloseTo(plain.appliedMs * 2, 6);
  });

  test('resolveStaggerHits: a batch never exceeds the remaining per-cycle budget', () => {
    const capMs = golemInterval * MAX_STAGGER_FRACTION_PER_CYCLE;
    const hits = Array.from({ length: 10 }, () => ({ amount: 9999, multiplier: 1 }));
    const fresh = flinch.resolveStaggerHits(hits, mossGolem, golemInterval, 0);
    expect(fresh.appliedMs).toBeCloseTo(capMs, 6);
    const partlySpent = flinch.resolveStaggerHits(hits, mossGolem, golemInterval, 300);
    expect(partlySpent.appliedMs).toBeCloseTo(capMs - 300, 6);
  });

  test('resolveStaggerHits: maxedFlinch fires once, on the batch that crosses the cap', () => {
    const hits = Array.from({ length: 10 }, () => ({ amount: 9999, multiplier: 1 }));
    const crossing = flinch.resolveStaggerHits(hits, mossGolem, golemInterval, 0);
    expect(crossing.maxedFlinch).toBe(true);
    // Same cycle, budget already spent: nothing applies and the callout must not re-fire.
    const followUp = flinch.resolveStaggerHits(hits, mossGolem, golemInterval, crossing.appliedMs);
    expect(followUp).toEqual({ appliedMs: 0, maxedFlinch: false });
    // A weak batch that stays under the cap never flags.
    const weak = flinch.resolveStaggerHits([{ amount: 13, multiplier: 1 }], mossGolem, golemInterval, 0);
    expect(weak.maxedFlinch).toBe(false);
  });

  test('SKILL_STAGGER_MULTIPLIER: one full-strength ultimate maxes the flinch on both demo enemies', () => {
    const ultimate = [{ amount: 9999, multiplier: SKILL_STAGGER_MULTIPLIER }];
    expect(flinch.resolveStaggerHits(ultimate, mossGolem, golemInterval, 0).maxedFlinch).toBe(true);
    expect(flinch.resolveStaggerHits(ultimate, swampFrog, frogInterval, 0).maxedFlinch).toBe(true);
    // Without the bonus the same hit only nudges the Golem (documents why the bonus exists).
    const plain = [{ amount: 9999, multiplier: 1 }];
    expect(flinch.resolveStaggerHits(plain, mossGolem, golemInterval, 0).maxedFlinch).toBe(false);
  });
});

function makeCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    stats: { pow: 10, vit: 20, spd: 5 },
    potentialStats: { pow: 30, vit: 30, spd: 10 },
    level: 1,
    baseHp: 50,
    currentLevelExp: 100,
    vitHpMultiplier: 6,
    maxHp: 170,
    currentHp: 170,
    skillCooldown: 0,
    maxCooldown: 30,
    unlockedSkillIds: ['warrior-smash'],
    selectedSkillId: 'warrior-smash',
    unlockedPassiveIds: [],
    skillLevels: {},
    ...overrides,
  };
}

describe('weighHitsByAttacker', () => {
  // 'warrior-blood-roar' is the warrior's staggerPushMultiplier passive (1.5 at level 1).
  const pusher = makeCharacter({ id: 'pusher', unlockedPassiveIds: ['warrior-blood-roar'] });
  const plain = makeCharacter({ id: 'plain' });
  const party = [pusher, plain];

  test('an attacker with no stagger passive weighs 1x', () => {
    expect(flinch.weighHitsByAttacker([{ amount: 20, characterId: 'plain' }], party, 2.5, 'match')).toEqual([
      { amount: 20, multiplier: 1 },
    ]);
  });

  test('an unknown or missing attacker weighs 1x (no passive to read)', () => {
    expect(flinch.weighHitsByAttacker([{ amount: 20 }], party, 2.5, 'match')[0].multiplier).toBe(1);
    expect(flinch.weighHitsByAttacker([{ amount: 20, characterId: 'ghost' }], party, 2.5, 'match')[0].multiplier).toBe(
      1,
    );
  });

  test("the attacker's stagger passive scales the hit", () => {
    const [hit] = flinch.weighHitsByAttacker([{ amount: 20, characterId: 'pusher' }], party, 2.5, 'match');
    expect(hit.multiplier).toBeCloseTo(1.5);
  });

  test('skillMultiplier applies only when the source is a skill', () => {
    const asMatch = flinch.weighHitsByAttacker([{ amount: 20, characterId: 'pusher' }], party, 2.5, 'match');
    const asSkill = flinch.weighHitsByAttacker([{ amount: 20, characterId: 'pusher' }], party, 2.5, 'skill');
    expect(asMatch[0].multiplier).toBeCloseTo(1.5);
    expect(asSkill[0].multiplier).toBeCloseTo(1.5 * 2.5);
    // A missing source is treated as a match (the damageEnemyAtom path omits it).
    expect(flinch.weighHitsByAttacker([{ amount: 20, characterId: 'pusher' }], party, 2.5)[0].multiplier).toBeCloseTo(
      1.5,
    );
  });

  test('each hit in a batch keeps its own attacker and order', () => {
    const weighed = flinch.weighHitsByAttacker(
      [
        { amount: 13, characterId: 'plain' },
        { amount: 16, characterId: 'pusher' },
      ],
      party,
      2.5,
      'skill',
    );
    expect(weighed.map((h) => h.amount)).toEqual([13, 16]);
    expect(weighed[0].multiplier).toBeCloseTo(2.5);
    expect(weighed[1].multiplier).toBeCloseTo(1.5 * 2.5);
  });

  test('an empty batch weighs to an empty batch', () => {
    expect(flinch.weighHitsByAttacker([], party, 2.5, 'skill')).toEqual([]);
  });
});
