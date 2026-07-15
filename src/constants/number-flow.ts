/**
 * Shared animation timing constants for NumberFlow components.
 * Designed for a snappy pixel-game feel.
 */

export const SNAPPY_SPIN_TIMING: EffectTiming = {
  duration: 300,
  easing: 'ease-out',
};

export const SNAPPY_TRANSFORM_TIMING: EffectTiming = {
  duration: 300,
  easing: 'ease-out',
};

export const SNAPPY_OPACITY_TIMING: EffectTiming = {
  duration: 200,
  easing: 'ease-out',
};

/**
 * Timing for counters that are driven every animation frame by an external rAF loop
 * (e.g. the battle-rewards EXP numbers, which mirror `ExperienceBar`'s fill).
 * The easing approximates `easeOutCubic` (1 - (1-t)^3) so the digit roll matches the
 * bar's deceleration instead of fighting it with a different curve. Duration is short
 * since the value itself already carries the eased motion — this just smooths each tick.
 */
export const EXP_COUNTER_TIMING: EffectTiming = {
  duration: 120,
  easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
};

import type { Format } from '@number-flow/react';

/** Format for integer values (no decimals) */
export const INTEGER_FORMAT: Format = {
  maximumFractionDigits: 0,
};

/** Format for values with 2 decimal places */
export const DECIMAL_2_FORMAT: Format = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** Format for multipliers — trims trailing zeros (×1.5, ×2, ×1.25). */
export const MULTIPLIER_FORMAT: Format = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};
