/**
 * Tunables for map footsteps. Per-map baselines live on each map config as
 * `footstepVolume` / `footstepPitch`; these are the defaults and the shared variance.
 */

/** Volume baseline for maps that don't set `footstepVolume`. Acts as a ceiling: jitter only lowers it. */
export const DEFAULT_FOOTSTEP_VOLUME = 0.8;

/** Playback-rate baseline for maps that don't set `footstepPitch`. */
export const DEFAULT_FOOTSTEP_PITCH = 1;

/** Downward-only volume jitter, as a fraction of the baseline. */
export const FOOTSTEP_VOLUME_VARIANCE = 0.15;

/** Symmetric random pitch jitter (±), as a playback-rate fraction. */
export const FOOTSTEP_PITCH_VARIANCE = 0.05;

/** Fixed pitch offset between feet: left plays lower, right higher, for a natural gait. */
export const FOOTSTEP_FOOT_PITCH_BIAS = 0.02;

/** Running footfalls land harder. Result is clamped to 1. */
export const FOOTSTEP_RUN_VOLUME_MULTIPLIER = 1.15;

/** Running footfalls are quicker and slightly higher. */
export const FOOTSTEP_RUN_PITCH_MULTIPLIER = 1.04;

/** Floor between two footfalls, so tapping a direction can't stack step-off plants. */
export const FOOTSTEP_MIN_INTERVAL_MS = 120;

/** How many of the most recent samples are excluded from the next pick. */
export const FOOTSTEP_NO_REPEAT_WINDOW = 2;

/** Footfalls per walk/run animation cycle: one per foot. */
export const FOOTFALLS_PER_ANIM_CYCLE = 2;
