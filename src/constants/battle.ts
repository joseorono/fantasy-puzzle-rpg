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
// ceiling. Full design + math: docs/COMBAT_SYSTEM.md.

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

/**
 * Multiplies the raw stagger push of skill (ultimate) hits before the per-cycle clamp, so a
 * single ultimate reliably maxes the flinch on most enemies. Never bypasses the cap.
 */
export const SKILL_STAGGER_MULTIPLIER = 2.5;

// ─── Enemy Poise / Break ─────────────────────────────────────────────────────
// Builds on top of Flinch: the same hit that nudges the attack timer also deals "poise damage"
// to a per-enemy posture pool. Emptying it Breaks the enemy — its pending attack is cancelled,
// it stays vulnerable for a window, then re-arms behind two anti-stunlock guards (poise-damage
// immunity + an escalating pool). Math in `~/lib/poise-system`; design in docs/ENEMY_POISE_STAGGER.md.

/** Pool size as a fraction of max HP: a poise-1 enemy Breaks after taking this share of its HP as poise damage. */
export const POISE_POOL_HP_FRACTION = 0.4;

/**
 * Multiplies the poise damage of skill (ultimate) hits. Deliberately separate from
 * {@link SKILL_STAGGER_MULTIPLIER}: an ultimate that maxes the flinch should not automatically Break.
 */
export const POISE_SKILL_MULTIPLIER = 2.0;

/** How long (ms) a Break lasts: the attack is cancelled and the enemy takes bonus damage for this window. */
export const POISE_BREAK_STAGGER_DURATION_MS = 2500;

/** Bonus HP damage on a staggered enemy, e.g. `0.5` = +50%. Mirrors {@link PREEMPTIVE_STRIKE_DAMAGE_BONUS}. */
export const POISE_BREAK_DAMAGE_BONUS = 0.5;

/**
 * After a Break ends, the enemy ignores poise damage for this long (ms). HP damage and the Flinch
 * push still land — this only stops the pool from filling again immediately.
 */
export const POISE_BREAK_IMMUNITY_MS = 2000;

/** Each Break raises the enemy's max poise by this fraction of its ORIGINAL max. */
export const POISE_MAX_GROWTH_PER_BREAK = 0.25;

/** Hard cap on escalated max poise, as a multiple of the original: 1.5 = never above 150%. */
export const POISE_MAX_GROWTH_CAP = 1.5;

/**
 * Extra poise damage per cascade level, on top of what the combo damage multiplier already adds
 * (hit amounts carry it). `0` = combos fill poise exactly as fast as they deal HP damage.
 */
export const POISE_CASCADE_BONUS_PER_LEVEL = 0;

/**
 * Pool refill while not staggered, as a fraction of max per second. `0` = off; immunity and the
 * escalation cap already stop chain-Breaks, so only enable this if long fights feel like a
 * guaranteed Break.
 */
export const POISE_REGEN_PER_SECOND = 0;

/** How long (ms) the "Staggered!" Break callout holds (the "Flinched!" one keeps its own 900 ms). */
export const POISE_BREAK_CALLOUT_DURATION_MS = 1300;

/** How long (ms) a centered battle callout ("Preemptive Strike!", "No moves! Reshuffle!") stays on screen. */
export const BATTLE_CALLOUT_DURATION_MS = 1200;

// ─── Board Hint ──────────────────────────────────────────────────────────────

/**
 * How long (ms) the board must sit idle — settled, unpaused, no pending victory — before one
 * legal swap gets the muted hint ring. The hint stays until the next valid swap or a pause.
 * `0` shows it as soon as the board settles. Ring styling lives in `ORB_HINT_CLASSES`.
 */
export const BOARD_HINT_DELAY_MS = 4000;

/**
 * Notches drawn across the party HP and Guard bars. Purely visual — it does not
 * segment the underlying values, which stay continuous percentages.
 */
export const PARTY_BAR_SEGMENTS = 10;

/**
 * Drifting motes in the battle screen's ambient background layer. Purely decorative.
 * Each one is an always-animating element, so this is the knob to turn down first
 * when tuning the battle screen for low-end machines.
 */
export const BATTLE_AMBIENT_PARTICLE_COUNT = 20;

// ─── Battle Loop ─────────────────────────────────────────────────────────────

/** How often the battle loop ticks Guard decay and skill cooldowns. */
export const BATTLE_TICK_INTERVAL_MS = 100;

/** The tick interval as seconds, for the rate-based systems the loop drives. */
export const BATTLE_TICK_DELTA_SECONDS = BATTLE_TICK_INTERVAL_MS / 1000;

/**
 * How often the item bar re-reads the clock for its "Ns" cooldown label. The sweeping wedge is a
 * CSS animation and does not depend on this; only the digit does, and it is guarded against repeat
 * values, so the bar still re-renders at most once per second no matter how small this gets.
 */
export const ITEM_COOLDOWN_LABEL_TICK_MS = 250;

// ─── Damage Pipeline ─────────────────────────────────────────────────────────
// Damage is a pure product of multipliers: base * matchSize * cascade * POW * gray * preemptive.
// There is no defense stat, crit, or variance, so these coefficients are the whole curve.

/**
 * Percent damage gained per point of POW, applied last in the damage pipeline. At 1 the POW term
 * was the weakest multiplier in the chain (match size and cascade each reach 2x), so single points
 * often vanished into the rounding; 2 puts a POW build roughly on par with a match-size tier.
 */
export const POW_DAMAGE_PERCENT_PER_POINT = 2;

/**
 * Combo bonus coefficient. Damage scales with the SQUARE ROOT of cascade depth
 * (diminishing returns), so deep chains keep rewarding without exploding. The
 * initial post-swap match is cascade level 0. Equipment combo bonus adds to this.
 */
export const CASCADE_DAMAGE_BONUS_PER_LEVEL = 0.35;

/** Hard ceiling on the cascade combo multiplier, regardless of chain depth. */
export const MAX_COMBO_MULTIPLIER = 2.0;

// ─── Guard Meter ─────────────────────────────────────────────────────────────
// Gray orbs trade raw damage for a party-wide Guard meter. Three independent levers move it:
// SPD sets how fast it charges, VIT how slowly it bleeds, and the enemy's `guardBreak` how much
// a block drains. The math itself lives in `~/lib/rpg-calculations`.

/** Maximum value of the party Guard meter (a full bar). */
export const GUARD_MAX = 100;

/** Reduction cap: 1 = a full Guard bar can fully block one attack. */
export const MAX_GUARD_REDUCTION = 1;

/** Fraction of the Guard bar a full-strength block consumes, before guardBreak scaling. */
export const GUARD_DRAIN_FRACTION = 0.5;

/** Guard points bled per second at a full bar; scales down with fill (anti-hoard decay). */
export const GUARD_DECAY_RATE = 3;

/** Divisor controlling how steeply party SPD raises the Guard Charge Rate (higher = gentler). */
export const GUARD_CHARGE_RATE_DIVISOR = 25;

/**
 * Steepness of VIT-based Guard decay resistance, on a hyperbolic curve. Larger = VIT matters less.
 * Resistance stays in `(0, 1]`, so stacking VIT slows the bleed but never stops it.
 */
export const GUARD_DECAY_VIT_DIVISOR = 150;

/**
 * Guard below this snaps to 0. Decay is proportional to fill, so it approaches zero
 * asymptotically and would otherwise never land — leaving the meter ticking forever.
 */
export const GUARD_MIN_THRESHOLD = 0.5;
