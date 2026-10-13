import { describe, expect, test } from 'vitest';
import { pickTransition } from './view-transitions';

describe('pickTransition', () => {
  const pool = ['a', 'b', 'c'] as const;

  test('returns a member of the pool', () => {
    for (let i = 0; i < 50; i++) {
      expect(pool).toContain(pickTransition(pool, null));
    }
  });

  test('never repeats the previous pick while the pool has an alternative', () => {
    let previous: string | null = null;
    for (let i = 0; i < 200; i++) {
      const pick: string = pickTransition<string>(pool, previous);
      expect(pick).not.toBe(previous);
      previous = pick;
    }
  });

  test('eventually draws every entry', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickTransition(pool, null));
    expect(seen.size).toBe(pool.length);
  });

  test('falls back to the only entry of a single-item pool', () => {
    expect(pickTransition(['solo'], 'solo')).toBe('solo');
  });

  test('throws on an empty pool', () => {
    expect(() => pickTransition([], null)).toThrow();
  });
});
