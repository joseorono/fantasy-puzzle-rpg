/** Per-enemy standby roll range (ms). Pooled then re-split across the encounter. */
export const ENEMY_STANDBY_MIN_MS = 1000;
export const ENEMY_STANDBY_MAX_MS = 3000;

/**
 * Bonus damage multiplier applied when a hit lands on an enemy that is still on its
 * start-of-battle standby ("preemptive strike"). A small reward for catching them observing;
 * e.g. `0.25` = +25% damage.
 */
export const PREEMPTIVE_STRIKE_DAMAGE_BONUS = 0.25;

// ─── Enemy Stagger (a.k.a. "Flinch") ─────────────────────────────────────────
// Every hit pushes the enemy's next attack back a little, scaled by how hard it lands and
// reduced by VIT, but hard-capped per attack cycle so you can slow an enemy yet never stunlock
// it. Subtle-juice tuning: a single hard hit lands only a fraction of the per-cycle cap, so
// stagger accumulates over a couple of hits and VIT visibly changes how fast you reach the
// ceiling. Full design + math: docs/ideas-proposals/ENEMY_STAGGER.md.

/**
 * Scales a full-strength, no-resist hit to this fraction of the enemy's attack interval, before
 * the per-cycle cap. Keep it well below {@link MAX_STAGGER_FRACTION_PER_CYCLE} so a single hit
 * can't max the cap outright — that would kill both the multi-hit accumulation feel and any VIT
 * differentiation on strong hits.
 */
export const BASE_STAGGER_FRACTION = 0.1;

/**
 * Hard ceiling on the total push-back applied between two of an enemy's attacks, as a fraction
 * of its interval. THIS IS THE ANTI-STUNLOCK KNOB: an enemy always fires within
 * `interval * (1 + MAX_STAGGER_FRACTION_PER_CYCLE)` of its previous attack, for any hit rate.
 */
export const MAX_STAGGER_FRACTION_PER_CYCLE = 0.12;

/**
 * A hit dealing this fraction of an enemy's max HP counts as a "full" hard hit
 * (`damageRatio = 1`); smaller hits scale down linearly. Ties "how hard" to the enemy's
 * durability, so the same blow flinches a frail enemy more than a tanky one.
 */
export const STAGGER_REF_FRACTION = 0.15;

/**
 * Steepness of VIT-based stagger resistance on a diminishing (square-root) curve. Larger = VIT
 * matters less. Resistance stays in `(0, 1]`, so every enemy always flinches at least a little.
 */
export const STAGGER_VIT_DIVISOR = 8;
