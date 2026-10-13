/**
 * Progression tunables: how expensive a level is, and how much EXP an enemy is worth.
 *
 * These two curves are a matched pair — changing one without the other moves the
 * whole pacing of the campaign. They are tuned together against a single target:
 *
 *   **A ~3 hour run that finishes around level 30**, which works out to roughly
 *   70 battles (~2.5 min per battle cycle including rewards, map, and menus).
 *
 * A level-up lands about every 2–3 battles on average: near-instant for the first
 * few levels, then settling to one every ~4 battles by the late 20s.
 *
 * Every party member receives the *full* battle EXP — it is not divided among them
 * (see `calculateLevelUpsForParty`), so "EXP per battle" below means per character.
 */

// ─── Level Curve ─────────────────────────────────────────────────────────────
// Cost to clear a level is `EXP_BASE * level ** EXP_CURVE_POWER` — a polynomial.
// It must stay sub-exponential: an exponential curve (the previous `Math.exp(level)`)
// makes the first handful of levels arrive inside a single battle and then puts
// everything past level ~10 out of reach entirely, at any enemy EXP value.

/**
 * EXP to clear level 1, and the scalar on the whole curve. Raising it slows the
 * entire game uniformly; prefer this over touching enemy rewards when the campaign
 * feels too short or too long overall.
 */
export const EXP_BASE = 12;

/**
 * Steepness of the level curve. 1 would make every level cost the same; higher
 * values make late levels progressively more expensive. THIS IS THE SHAPE KNOB —
 * small changes compound hard across 30 levels, so move it in steps of 0.1.
 *
 * At 1.5, level 30 costs ~164x level 1, which lands at ~70 battles once enemy
 * rewards scale as below.
 */
export const EXP_CURVE_POWER = 1.5;

// ─── Enemy Rewards ───────────────────────────────────────────────────────────
// An enemy's EXP is derived from its durability, because durability is what
// actually costs the player time in a match-3 fight — there is no defense stat,
// so time-to-kill is essentially maxHp divided by the party's damage.
//
// Deriving it this way fixes a real hazard of hand-authored values: a 400 HP elite
// worth 60 EXP alongside a 68 HP trash mob worth 30 means farming trash is nearly
// 3x the EXP per second. Tie EXP to HP and that inversion cannot happen.

/**
 * EXP granted per point of an enemy's max HP. The dominant term for anything
 * tanky. Raising it makes elites and bosses disproportionately more rewarding.
 */
export const ENEMY_EXP_PER_HP = 1 / 8;

/**
 * Flat EXP every enemy grants regardless of size, so clearing a swarm of weak
 * mobs is still worth doing. Raising it flattens the gap between trash and elites.
 */
export const ENEMY_EXP_FLAT = 12;
