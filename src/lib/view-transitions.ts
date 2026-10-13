import { getRandomElement } from '~/lib/utils';

/**
 * Draws one entry from `pool` at random, never the same as `previous` while the pool offers
 * an alternative. Used to vary the pre-battle transition between consecutive encounters.
 *
 * @param pool - Candidates to draw from; must be non-empty.
 * @param previous - The last pick to avoid, or `null` when there is none.
 * @returns A member of `pool`.
 * @throws If `pool` is empty.
 */
export function pickTransition<T>(pool: readonly T[], previous: T | null): T {
  if (pool.length === 0) throw new Error('pickTransition: pool must not be empty');
  const candidates = pool.filter((entry) => entry !== previous);
  return getRandomElement(candidates.length > 0 ? candidates : pool);
}
