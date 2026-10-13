import { bench, describe } from 'vitest';
import {
  calculateStaggerPushMs,
  clampStaggerToCycleBudget,
  resolveStaggerHits,
  weighHitsByAttacker,
  type StaggerHit,
} from './flinch-system';
import { BENCH_OPTIONS } from './bench-options';
import { SKILL_STAGGER_MULTIPLIER } from '~/constants/battle';
import type { CharacterData } from '~/types/rpg-elements';

// Demo roster stats (src/constants/enemies/world-00): the tankiest enemy and its interval.
const mossGolem = { maxHp: 400, vit: 70 };
const golemInterval = 4000;

const oneHit: StaggerHit[] = [{ amount: 13, multiplier: 1 }];
// The worst realistic batch: a four-color match landing every color at once.
const fourHits: StaggerHit[] = [
  { amount: 13, multiplier: 1 },
  { amount: 16, multiplier: 1 },
  { amount: 11, multiplier: 1.5 },
  { amount: 22, multiplier: 1 },
];

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

// 'warrior-blood-roar' is the warrior's staggerPushMultiplier passive — the path that actually
// walks the passive registry, so the bench measures the real per-hit lookup cost.
const party = [
  makeCharacter({ id: 'pusher', unlockedPassiveIds: ['warrior-blood-roar'] }),
  makeCharacter({ id: 'plain' }),
];
const rawHits = [
  { amount: 13, characterId: 'plain' },
  { amount: 16, characterId: 'pusher' },
  { amount: 11, characterId: 'plain' },
  { amount: 22, characterId: 'pusher' },
];

// ── Stagger Calculations ──

describe('Stagger Calculations', () => {
  bench(
    'calculateStaggerPushMs',
    () => {
      calculateStaggerPushMs(50, 300, 50, 4000);
    },
    BENCH_OPTIONS,
  );

  bench(
    'clampStaggerToCycleBudget',
    () => {
      clampStaggerToCycleBudget(200, 4000, 100);
    },
    BENCH_OPTIONS,
  );

  bench(
    'resolveStaggerHits (1 hit)',
    () => {
      resolveStaggerHits(oneHit, mossGolem, golemInterval, 0);
    },
    BENCH_OPTIONS,
  );

  bench(
    'resolveStaggerHits (4-hit batch)',
    () => {
      resolveStaggerHits(fourHits, mossGolem, golemInterval, 0);
    },
    BENCH_OPTIONS,
  );
});

// ── Hit Weighing ──

describe('Hit Weighing', () => {
  bench(
    'weighHitsByAttacker (1 hit, match)',
    () => {
      weighHitsByAttacker(rawHits.slice(0, 1), party, SKILL_STAGGER_MULTIPLIER, 'match');
    },
    BENCH_OPTIONS,
  );

  bench(
    'weighHitsByAttacker (4 hits, skill)',
    () => {
      weighHitsByAttacker(rawHits, party, SKILL_STAGGER_MULTIPLIER, 'skill');
    },
    BENCH_OPTIONS,
  );
});
