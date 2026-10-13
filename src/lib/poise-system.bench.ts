import { bench, describe } from 'vitest';
import {
  applyPoiseHits,
  calculatePoiseDamage,
  createEnemyPoiseState,
  resolveEscalatedMaxPoise,
  resolveStaggeredEnemySignature,
  resolveVulnerableHits,
  tickEnemyPoise,
} from './poise-system';
import type { EnemyPoiseState } from '~/types/battle';
import type { StaggerHit } from './flinch-system';
import { BENCH_OPTIONS } from './bench-options';

// Demo roster stats (src/constants/enemies/world-00): the tankiest enemy, pool = 160.
const golem = { maxHp: 400 };
const fresh = createEnemyPoiseState(golem);

const oneHit: StaggerHit[] = [{ amount: 13, multiplier: 1 }];
// The worst realistic batch: a four-color match landing every color at once.
const fourHits: StaggerHit[] = [
  { amount: 13, multiplier: 1 },
  { amount: 16, multiplier: 1 },
  { amount: 11, multiplier: 1.5 },
  { amount: 22, multiplier: 1 },
];
const breakingBatch: StaggerHit[] = [
  { amount: 60, multiplier: 1 },
  { amount: 80, multiplier: 1.5 },
];

const rawHits = [
  { amount: 13, characterId: 'a' },
  { amount: 16, characterId: 'b' },
  { amount: 11, characterId: 'c' },
  { amount: 22, characterId: 'd' },
];

// Four-enemy records: everyone idle (the common case, must return the same reference) and two
// mid-stagger (the tick has to copy the record and both moved entries).
const idleRecord: Record<string, EnemyPoiseState> = { a: fresh, b: fresh, c: fresh, d: fresh };
const staggeredRecord: Record<string, EnemyPoiseState> = {
  a: { ...fresh, staggerRemainingMs: 1800 },
  b: fresh,
  c: { ...fresh, staggerRemainingMs: 400 },
  d: fresh,
};

describe('Poise Calculations', () => {
  bench(
    'calculatePoiseDamage',
    () => {
      calculatePoiseDamage(13, 0.5, 1.5, 2);
    },
    BENCH_OPTIONS,
  );

  bench(
    'resolveEscalatedMaxPoise',
    () => {
      resolveEscalatedMaxPoise(160, 2);
    },
    BENCH_OPTIONS,
  );

  bench(
    'applyPoiseHits (1 hit)',
    () => {
      applyPoiseHits(fresh, oneHit, 0.5);
    },
    BENCH_OPTIONS,
  );

  bench(
    'applyPoiseHits (4-hit batch)',
    () => {
      applyPoiseHits(fresh, fourHits, 0.5);
    },
    BENCH_OPTIONS,
  );

  bench(
    'applyPoiseHits (batch that breaks)',
    () => {
      applyPoiseHits(fresh, breakingBatch, 1);
    },
    BENCH_OPTIONS,
  );

  bench(
    'resolveVulnerableHits (4 hits, staggered)',
    () => {
      resolveVulnerableHits(rawHits, true);
    },
    BENCH_OPTIONS,
  );
});

describe('Poise Tick', () => {
  bench(
    'tickEnemyPoise (4 enemies, all idle → same reference)',
    () => {
      tickEnemyPoise(idleRecord, 0.1);
    },
    BENCH_OPTIONS,
  );

  bench(
    'tickEnemyPoise (4 enemies, 2 staggered)',
    () => {
      tickEnemyPoise(staggeredRecord, 0.1);
    },
    BENCH_OPTIONS,
  );

  bench(
    'resolveStaggeredEnemySignature (4 enemies, 2 staggered)',
    () => {
      resolveStaggeredEnemySignature(staggeredRecord);
    },
    BENCH_OPTIONS,
  );
});
