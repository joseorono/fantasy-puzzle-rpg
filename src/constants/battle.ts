/** Per-enemy standby roll range (ms). Pooled then re-split across the encounter. */
export const ENEMY_STANDBY_MIN_MS = 1000;
export const ENEMY_STANDBY_MAX_MS = 3000;

/**
 * Bonus damage multiplier applied when a hit lands on an enemy that is still on its
 * start-of-battle standby ("preemptive strike"). A small reward for catching them observing;
 * e.g. `0.25` = +25% damage.
 */
export const PREEMPTIVE_STRIKE_DAMAGE_BONUS = 0.25;
