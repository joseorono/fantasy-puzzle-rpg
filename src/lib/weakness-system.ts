import { WEAKNESS_DAMAGE_BONUS } from '~/constants/battle';
import type { DamageKind, OrbType, WeaknessSource } from '~/types/rpg-elements';

/**
 * Whether a hit exploits an enemy weakness. A colour weakness counts whoever lands that colour;
 * an `'ultimate'` weakness counts every Ultimate. Matching both still counts once.
 * @param weakTo The enemy's weaknesses (`EnemyData.weakTo`); absent = none
 * @param hit The colour that produced the hit (absent for colourless damage) and its kind
 * @returns True when the hit gets the weakness bonus
 */
export function isWeakTo(
  weakTo: readonly WeaknessSource[] | undefined,
  hit: { color?: OrbType; kind: DamageKind },
): boolean {
  if (!weakTo || weakTo.length === 0) return false;
  if (hit.kind === 'ultimate' && weakTo.includes('ultimate')) return true;
  return hit.color !== undefined && weakTo.includes(hit.color);
}

/**
 * HP damage of a single hit after the weakness bonus.
 * @param amount The hit's damage before the bonus
 * @param isWeak Whether the hit exploits a weakness (see {@link isWeakTo})
 * @returns `amount × (1 + WEAKNESS_DAMAGE_BONUS)`, rounded, or `amount` unchanged
 */
export function resolveWeaknessDamage(amount: number, isWeak: boolean): number {
  if (!isWeak) return amount;
  return Math.round(amount * (1 + WEAKNESS_DAMAGE_BONUS));
}

/**
 * Applies the weakness bonus to a batch of match hits, each judged by its own colour.
 * @param hits The hits about to land; `orbType` is the colour that produced each one
 * @param weakTo The target's weaknesses (`EnemyData.weakTo`)
 * @returns The hits (the same array when none is weak) and whether any of them was weak
 */
export function resolveWeaknessHits<T extends { amount: number; orbType?: OrbType }>(
  hits: T[],
  weakTo: readonly WeaknessSource[] | undefined,
): { hits: T[]; isWeak: boolean } {
  const weakFlags = hits.map((hit) => isWeakTo(weakTo, { color: hit.orbType, kind: 'match' }));
  if (!weakFlags.includes(true)) return { hits, isWeak: false };
  return {
    hits: hits.map((hit, index) => ({ ...hit, amount: resolveWeaknessDamage(hit.amount, weakFlags[index]) })),
    isWeak: true,
  };
}
