/**
 * Enemy Poise / Break calculations.
 *
 * Every enemy carries a posture ("poise") pool derived from its max HP. The same hit that
 * flinches its attack timer (see `~/lib/flinch-system`) also deals poise damage, scaled by the
 * enemy's `poise` multiplier. Emptying the pool **Breaks** the enemy: its pending attack is
 * cancelled and it takes bonus HP damage for a stagger window. Two guards stop chain-Breaks —
 * a poise-damage immunity window after recovery, and a max pool that escalates per Break up to
 * a hard cap relative to the original.
 *
 * The stagger and immunity windows are **remaining-ms counters** owned by battle state and ticked
 * by `battleTickAtom` (pause-safe, works in training, no timers to fake in tests). This module is
 * the pure math; the atoms in `~/stores/battle-atoms` apply it, the attack-timer hook reacts to
 * it, and the tunables live in `~/constants/battle`. Design: docs/ENEMY_POISE_STAGGER.md.
 */

import {
  POISE_BREAK_DAMAGE_BONUS,
  POISE_BREAK_IMMUNITY_MS,
  POISE_BREAK_STAGGER_DURATION_MS,
  POISE_CASCADE_BONUS_PER_LEVEL,
  POISE_MAX_GROWTH_CAP,
  POISE_MAX_GROWTH_PER_BREAK,
  POISE_POOL_HP_FRACTION,
  POISE_REGEN_PER_SECOND,
} from '~/constants/battle';
import type { EnemyPoisePhase, EnemyPoiseState, EnemyPoiseSummary } from '~/types/battle';
import type { StaggerHit } from './flinch-system';

/** A hit that may be boosted by the vulnerable window; anything with an `amount`. */
interface DamageHit {
  amount: number;
}

/**
 * Derives an enemy's max poise pool from its max HP.
 * @param enemy The enemy's durability (`maxHp`)
 * @returns The pool size: `maxHp × POISE_POOL_HP_FRACTION`
 */
export function calculateMaxPoise(enemy: { maxHp: number }): number {
  return enemy.maxHp * POISE_POOL_HP_FRACTION;
}

/**
 * Seeds a fresh, full poise pool for an enemy at battle start.
 * @param enemy The enemy's durability (`maxHp`)
 * @returns A state with `current === max === originalMax`, no Breaks, both windows closed
 */
export function createEnemyPoiseState(enemy: { maxHp: number }): EnemyPoiseState {
  const max = calculateMaxPoise(enemy);
  return { current: max, max, originalMax: max, breakCount: 0, staggerRemainingMs: 0, immuneRemainingMs: 0 };
}

/**
 * Poise damage dealt by one hit. Hit amounts already carry the match-size and cascade damage
 * multipliers, so combos fill the pool faster by construction; `cascadeLevel` only adds the
 * optional extra on top (`POISE_CASCADE_BONUS_PER_LEVEL`, off by default).
 * @param amount The HP damage the hit dealt
 * @param poiseMultiplier The enemy's `poise` stat (default 1; `0.5` stoic, `2` glass jaw)
 * @param hitMultiplier The hit's own multiplier (attacker passive × skill bonus), 1 = none
 * @param cascadeLevel Cascade depth of the match that produced the hit; 0 = the swap itself
 * @returns Poise damage (>= 0)
 */
export function calculatePoiseDamage(
  amount: number,
  poiseMultiplier: number,
  hitMultiplier: number,
  cascadeLevel: number = 0,
): number {
  if (amount <= 0) return 0;
  const cascadeBonus = 1 + Math.max(0, cascadeLevel) * POISE_CASCADE_BONUS_PER_LEVEL;
  return Math.max(0, amount * poiseMultiplier * hitMultiplier * cascadeBonus);
}

/**
 * Max poise after `breakCount` Breaks: grows by `POISE_MAX_GROWTH_PER_BREAK` of the original per
 * Break and is hard-capped at `originalMax × POISE_MAX_GROWTH_CAP` (150% by default), so the
 * pool goes 100% → 125% → 150% → 150% and never further.
 * @param originalMax Max poise at battle start
 * @param breakCount Breaks suffered so far
 * @returns The escalated (capped) max
 */
export function resolveEscalatedMaxPoise(originalMax: number, breakCount: number): number {
  const grown = originalMax * (1 + Math.max(0, breakCount) * POISE_MAX_GROWTH_PER_BREAK);
  return Math.min(grown, originalMax * POISE_MAX_GROWTH_CAP);
}

/**
 * True while the enemy is Broken (attack cancelled, vulnerable).
 * @param state The enemy's poise state
 */
export function isEnemyStaggered(state: EnemyPoiseState): boolean {
  return state.staggerRemainingMs > 0;
}

/**
 * True while the enemy ignores poise damage (the post-recovery window). HP damage and Flinch
 * are unaffected.
 * @param state The enemy's poise state
 */
export function isPoiseImmune(state: EnemyPoiseState): boolean {
  return state.immuneRemainingMs > 0;
}

/** Result of landing a batch of hits on an enemy's poise pool. */
export interface PoiseHitResolution {
  /** The state after the batch; the SAME reference as the input when nothing changed */
  next: EnemyPoiseState;
  /** True when this batch emptied the pool (a once-per-Break transition) */
  didBreak: boolean;
}

/** Optional inputs to {@link applyPoiseHits}. */
export interface ApplyPoiseHitsOptions {
  /** Cascade depth of the match; 0 for the swap itself and for skills. */
  cascadeLevel?: number;
  /**
   * False while the enemy has no pending attack to cancel (still on its opening standby). The
   * pool still takes damage and the bar still moves — it just floors at 0 instead of Breaking, so
   * the Break lands on the first hit after the enemy starts attacking.
   */
  canBreak?: boolean;
}

/**
 * Lands a batch of hits (every color of a multi-color match, in order) on an enemy's poise pool.
 * Ignored entirely — the input state comes back by reference — while the enemy is Broken or
 * immune. When the pool empties: `breakCount + 1`, the max escalates (capped), the pool refills to
 * the new max, and the stagger window opens. Hits after the breaking one in the same batch are
 * absorbed by the Break; a batch can Break at most once.
 * @param state The enemy's poise state before the batch
 * @param hits The weighted hits (see `weighHitsByAttacker` in `~/lib/flinch-system`)
 * @param poiseMultiplier The enemy's `poise` stat (`enemy.poise ?? 1`)
 * @param options Cascade depth and whether a Break may fire; see {@link ApplyPoiseHitsOptions}
 * @returns The next state and whether the batch Broke the enemy
 */
export function applyPoiseHits(
  state: EnemyPoiseState,
  hits: StaggerHit[],
  poiseMultiplier: number,
  options: ApplyPoiseHitsOptions = {},
): PoiseHitResolution {
  if (isEnemyStaggered(state) || isPoiseImmune(state)) return { next: state, didBreak: false };
  const { cascadeLevel = 0, canBreak = true } = options;

  let current = state.current;
  for (const hit of hits) {
    current -= calculatePoiseDamage(hit.amount, poiseMultiplier, hit.multiplier, cascadeLevel);
    if (current <= 0) break;
  }
  if (current === state.current) return { next: state, didBreak: false };
  if (current > 0) return { next: { ...state, current }, didBreak: false };

  // Nothing to cancel yet: bank the damage at an empty pool so the bar reads "one more hit".
  if (!canBreak) return { next: { ...state, current: 0 }, didBreak: false };

  const breakCount = state.breakCount + 1;
  const max = resolveEscalatedMaxPoise(state.originalMax, breakCount);
  return {
    next: { ...state, current: max, max, breakCount, staggerRemainingMs: POISE_BREAK_STAGGER_DURATION_MS },
    didBreak: true,
  };
}

/**
 * Advances every enemy's poise windows by one battle tick. A stagger window that reaches 0 opens
 * the immunity window in the same tick; an open immunity window counts down; an idle pool
 * optionally regenerates. Copy-on-first-change: untouched enemies keep their identity and the
 * **input record itself** comes back when nothing moved, so `battleTickAtom` can skip its write
 * with a reference compare.
 * @param record Poise state per enemy id
 * @param deltaSeconds Elapsed time this tick
 * @param regenPerSecond Pool refill as a fraction of max per second (defaults to the constant; 0 = off)
 * @returns The same record when idle, otherwise a new record with the moved enemies replaced
 */
export function tickEnemyPoise(
  record: Record<string, EnemyPoiseState>,
  deltaSeconds: number,
  regenPerSecond: number = POISE_REGEN_PER_SECOND,
): Record<string, EnemyPoiseState> {
  const deltaMs = deltaSeconds * 1000;
  let next: Record<string, EnemyPoiseState> | null = null;

  for (const id in record) {
    const state = record[id];
    let moved: EnemyPoiseState | null = null;

    if (state.staggerRemainingMs > 0) {
      const staggerRemainingMs = Math.max(0, state.staggerRemainingMs - deltaMs);
      moved = {
        ...state,
        staggerRemainingMs,
        // Recovery opens the poise-damage immunity window in the same tick.
        immuneRemainingMs: staggerRemainingMs === 0 ? POISE_BREAK_IMMUNITY_MS : state.immuneRemainingMs,
      };
    } else {
      const immuneRemainingMs = state.immuneRemainingMs > 0 ? Math.max(0, state.immuneRemainingMs - deltaMs) : 0;
      const current =
        regenPerSecond > 0 && state.current < state.max
          ? Math.min(state.max, state.current + state.max * regenPerSecond * deltaSeconds)
          : state.current;
      if (immuneRemainingMs !== state.immuneRemainingMs || current !== state.current) {
        moved = { ...state, immuneRemainingMs, current };
      }
    }

    if (moved) {
      next ??= { ...record };
      next[id] = moved;
    }
  }

  return next ?? record;
}

/**
 * HP damage a single hit deals to a target that may be in its vulnerable (Broken) window.
 * @param amount The hit's damage before the bonus
 * @param isStaggered Whether the target was Broken when the hit landed (read from the pre-hit state)
 * @returns `amount × (1 + POISE_BREAK_DAMAGE_BONUS)`, rounded, or `amount` unchanged
 */
export function resolveVulnerableDamage(amount: number, isStaggered: boolean): number {
  if (!isStaggered) return amount;
  return Math.round(amount * (1 + POISE_BREAK_DAMAGE_BONUS));
}

/**
 * Applies the vulnerable-window bonus to a batch of hits. Mirror of the preemptive-strike map in
 * `damageEnemyAtom`; returns the input array by reference when the target is not Broken.
 * @param hits The hits about to land
 * @param isStaggered Whether the target was Broken when they landed (read from the pre-hit state)
 * @returns The boosted hits, or the same array
 */
export function resolveVulnerableHits<T extends DamageHit>(hits: T[], isStaggered: boolean): T[] {
  if (!isStaggered) return hits;
  return hits.map((hit) => ({ ...hit, amount: resolveVulnerableDamage(hit.amount, true) }));
}

/**
 * Ids of every Broken enemy joined into one string, so a subscriber compares it by value and is
 * only notified on a Break or a recovery — never on the per-tick countdown. Same trick as the
 * attack-timer hook's `rosterSignature`.
 * @param record Poise state per enemy id
 * @returns `'a|b'` for Broken enemies `a` and `b`, `''` when none is Broken
 */
export function resolveStaggeredEnemySignature(record: Record<string, EnemyPoiseState>): string {
  let signature = '';
  for (const id in record) {
    if (record[id].staggerRemainingMs <= 0) continue;
    signature = signature === '' ? id : `${signature}|${id}`;
  }
  return signature;
}

function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((100 * value) / max)));
}

/**
 * Reduces a poise state to the integer percents the bar draws (see {@link EnemyPoiseSummary}).
 * @param state The enemy's poise state
 * @returns The summary; a fresh object every call — cache it with {@link poiseSummariesMatch}
 */
export function summarizeEnemyPoise(state: EnemyPoiseState): EnemyPoiseSummary {
  const phase: EnemyPoisePhase = isEnemyStaggered(state) ? 'broken' : isPoiseImmune(state) ? 'immune' : 'ready';
  const windowPercent =
    phase === 'broken'
      ? toPercent(state.staggerRemainingMs, POISE_BREAK_STAGGER_DURATION_MS)
      : phase === 'immune'
        ? toPercent(state.immuneRemainingMs, POISE_BREAK_IMMUNITY_MS)
        : 0;
  return {
    phase,
    fillPercent: toPercent(state.current, state.max),
    windowPercent,
    breakCount: state.breakCount,
    originalMaxPercent: state.max > state.originalMax ? toPercent(state.originalMax, state.max) : null,
  };
}

/**
 * Field-by-field equality for two summaries, so a derived atom can hand back its previous value
 * and stay silent when a tick moved the state but not the picture.
 * @param a One summary
 * @param b The other
 * @returns True when nothing drawn would differ
 */
export function poiseSummariesMatch(a: EnemyPoiseSummary, b: EnemyPoiseSummary): boolean {
  return (
    a.phase === b.phase &&
    a.fillPercent === b.fillPercent &&
    a.windowPercent === b.windowPercent &&
    a.breakCount === b.breakCount &&
    a.originalMaxPercent === b.originalMaxPercent
  );
}

/**
 * One line of player-facing copy for the poise bar's hover title. There is no vertical room for a
 * caption under the enemy panel, so this is the only place the rules are spelled out: what the bar
 * measures, that a Break is worth chasing, and that ignored hits during recovery are "not yet"
 * rather than "not working".
 * @param summary The enemy's poise summary
 * @param isStandby True while the enemy is still observing, when poise damage does not apply yet
 * @returns The title text
 */
export function describeEnemyPoise(summary: EnemyPoiseSummary, isStandby: boolean = false): string {
  switch (summary.phase) {
    case 'broken':
      return 'Staggered! Bonus damage while the bar drains';
    case 'immune':
      return 'Recovering — poise damage is ignored while the bar rebuilds';
    default:
      return isStandby
        ? `Poise ${summary.fillPercent}% — it cannot be staggered until it starts attacking`
        : `Poise ${summary.fillPercent}% — empty it to stagger this enemy`;
  }
}

/**
 * Compact poise readout for the Training Grounds: the phase name while the pool is out of play,
 * else the fill percent plus a `×n` Break tally once the pool has escalated.
 * @param summary The enemy's poise summary
 * @returns The readout text
 */
export function formatEnemyPoise(summary: EnemyPoiseSummary): string {
  if (summary.phase === 'broken') return 'BROKEN';
  if (summary.phase === 'immune') return 'IMMUNE';
  return `${summary.fillPercent}%${summary.breakCount > 0 ? ` ×${summary.breakCount}` : ''}`;
}
