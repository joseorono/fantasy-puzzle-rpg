/**
 * Enemy Flinch (a.k.a. "stagger push") calculations.
 *
 * Every player hit nudges the struck enemy's next attack back a little, scaled by how hard the hit
 * lands and reduced by the enemy's VIT, but hard-capped per attack cycle so an enemy can be slowed
 * yet never stunlocked. This module is the pure math; the timers that consume it live in
 * `~/hooks/use-enemy-attack-timers`, and the tunables in `~/constants/battle`.
 *
 * Flinch is the *timer push* layer. The separate poise/Break layer (which cancels an attack
 * outright) shares this module's {@link StaggerHit} shape and {@link weighHitsByAttacker}, but
 * keeps its own pool and caps. See docs/ENEMY_POISE_STAGGER.md.
 */

import type { CharacterData } from '~/types/rpg-elements';
import {
  BASE_STAGGER_FRACTION,
  MAX_STAGGER_FRACTION_PER_CYCLE,
  STAGGER_REF_FRACTION,
  STAGGER_VIT_DIVISOR,
} from '~/constants/battle';
import { getCharacterPassiveModifiers } from './skill-system';

/**
 * Calculates the uncapped per-hit stagger push-back (ms) — how far a single hit delays the
 * enemy's next attack, before the per-cycle cap. Scaled by how hard the hit lands relative to
 * the enemy's max HP, and reduced by VIT on a diminishing (square-root) curve that never reaches
 * zero, so every enemy always flinches a little. Apply {@link clampStaggerToCycleBudget} to the
 * result to enforce the anti-stunlock cap. See docs/COMBAT_SYSTEM.md.
 * @param damage The damage dealt by the hit
 * @param enemyMaxHp The enemy's maximum HP (durability reference for "how hard")
 * @param vit The enemy's VIT stat (stagger resistance)
 * @param interval The enemy's effective attack interval in ms
 * @returns Uncapped push-back in milliseconds (>= 0)
 */
export function calculateStaggerPushMs(damage: number, enemyMaxHp: number, vit: number, interval: number): number {
  if (damage <= 0 || interval <= 0) return 0;
  const reference = enemyMaxHp * STAGGER_REF_FRACTION;
  const damageRatio = reference > 0 ? Math.min(1, damage / reference) : 1;
  // Clamp VIT >= 0 so negative-stat edge cases can't NaN via Math.sqrt.
  const vitResist = 1 / (1 + Math.sqrt(Math.max(0, vit)) / STAGGER_VIT_DIVISOR);
  return interval * BASE_STAGGER_FRACTION * damageRatio * vitResist;
}

/**
 * Clamps a stagger push against the remaining per-cycle budget so cumulative push-back between
 * two of an enemy's attacks can never exceed `interval * MAX_STAGGER_FRACTION_PER_CYCLE`. This is
 * the anti-stunlock guarantee: no hit pattern can stop the enemy from eventually attacking.
 * @param pushMs The uncapped push from {@link calculateStaggerPushMs}
 * @param interval The enemy's effective attack interval in ms
 * @param usedMs Push-back already applied during the current attack cycle
 * @returns The push-back to actually apply (>= 0), never exceeding the remaining budget
 */
export function clampStaggerToCycleBudget(pushMs: number, interval: number, usedMs: number): number {
  const capMs = interval * MAX_STAGGER_FRACTION_PER_CYCLE;
  return Math.max(0, Math.min(pushMs, capMs - usedMs));
}

/** One hit's contribution to a stagger batch: raw damage plus any push multipliers already folded in. */
export interface StaggerHit {
  /** Damage dealt by this hit */
  amount: number;
  /** Product of every push multiplier for this hit (attacker passives, skill bonus); 1 = none */
  multiplier: number;
}

/** Result of resolving a batch of hits against an enemy's per-cycle stagger budget. */
export interface StaggerResolution {
  /** Total push-back (ms) to add to the enemy's next release this batch, after clamping */
  appliedMs: number;
  /** True when this batch is the one that reaches the per-cycle cap (a once-per-cycle transition) */
  maxedFlinch: boolean;
}

/**
 * Resolves a batch of hits landing on one enemy at the same moment (e.g. every color of a
 * multi-color match) into a single stagger push. Each hit is scaled by
 * {@link calculateStaggerPushMs} and its own multiplier, then clamped in order against the
 * shared per-cycle budget via {@link clampStaggerToCycleBudget}, so the anti-stunlock cap holds
 * no matter how many hits a batch carries.
 * @param hits The hits in this batch (empty = no push)
 * @param enemy The struck enemy's durability (`maxHp`) and poise (`vit`)
 * @param interval The enemy's effective attack interval in ms
 * @param usedMs Push-back already applied during the current attack cycle
 * @returns The push to apply and whether this batch crossed the per-cycle cap
 */
export function resolveStaggerHits(
  hits: StaggerHit[],
  enemy: { maxHp: number; vit: number },
  interval: number,
  usedMs: number,
): StaggerResolution {
  const capMs = interval * MAX_STAGGER_FRACTION_PER_CYCLE;
  let appliedMs = 0;

  for (const hit of hits) {
    const push = calculateStaggerPushMs(hit.amount, enemy.maxHp, enemy.vit, interval) * hit.multiplier;
    appliedMs += clampStaggerToCycleBudget(push, interval, usedMs + appliedMs);
  }

  const maxedFlinch = usedMs < capMs && usedMs + appliedMs >= capMs - 1e-6;
  return { appliedMs, maxedFlinch };
}

/** A raw hit as it arrives on the `lastDamage` channel, before multipliers are resolved. */
export interface AttackerHit {
  /** Damage dealt by this hit */
  amount: number;
  /** Which party member landed it; absent = no attacker (no passive bonus) */
  characterId?: string;
}

/**
 * Folds each raw hit's push multipliers into a {@link StaggerHit}: the attacker's
 * `staggerPushMultiplier` passive, times `skillMultiplier` when the batch came from an Ultimate.
 * Both the flinch and the poise layer weigh their hits with this, each passing its own skill
 * constant (`SKILL_STAGGER_MULTIPLIER` / `POISE_SKILL_MULTIPLIER`), so one hit can push the attack
 * timer and the poise pool by different amounts while sharing the same passive.
 * @param hits The raw hits from a `lastDamage` event
 * @param party The current party, used to resolve each hit's attacker
 * @param skillMultiplier Multiplier to apply when `source` is `'skill'`
 * @param source What produced the hits; only `'skill'` applies `skillMultiplier`
 * @returns One weighted hit per input hit, in the same order
 */
export function weighHitsByAttacker(
  hits: AttackerHit[],
  party: CharacterData[],
  skillMultiplier: number,
  source?: 'match' | 'skill' | 'enemy',
): StaggerHit[] {
  const sourceMultiplier = source === 'skill' ? skillMultiplier : 1;
  return hits.map((hit) => {
    const attacker = hit.characterId ? party.find((char) => char.id === hit.characterId) : undefined;
    const passiveMultiplier = attacker ? getCharacterPassiveModifiers(attacker).staggerPushMultiplier : 1;
    return { amount: hit.amount, multiplier: passiveMultiplier * sourceMultiplier };
  });
}
