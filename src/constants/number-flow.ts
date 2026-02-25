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
