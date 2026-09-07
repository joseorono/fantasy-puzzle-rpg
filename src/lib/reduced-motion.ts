import { ACCESSIBILITY_DEFAULTS, ACCESSIBILITY_STORAGE_KEYS } from '~/constants/storage-keys';
import { readPersistedValue } from '~/lib/storage';
import { reducedMotionSchema } from '~/types/accessibility-types';

/** Presence of this attribute on `<html>` is what `src/styles/reduced-motion.css` keys off. */
const REDUCED_MOTION_ATTRIBUTE = 'data-reduced-motion';

// Cached rather than re-read: hitstop consults this on every hit that lands.
let isEnabled = readPersistedValue(
  ACCESSIBILITY_STORAGE_KEYS.reducedMotion,
  reducedMotionSchema,
  ACCESSIBILITY_DEFAULTS.reducedMotion,
);

/**
 * Whether motion should be dialled down right now. Timelines that CSS can't reach (JS-driven
 * reveals, hitstop, exp bar tweens) should skip straight to their final state when this is true.
 */
export function isReducedMotion(): boolean {
  return isEnabled;
}

/**
 * Applies the setting: caches it for {@link isReducedMotion} and flips the `<html>` attribute the
 * global CSS overrides hang off.
 *
 * @param enabled Whether reduced motion is on.
 */
export function applyReducedMotion(enabled: boolean): void {
  isEnabled = enabled;
  if (typeof document === 'undefined') return;
  document.documentElement.toggleAttribute(REDUCED_MOTION_ATTRIBUTE, enabled);
}

/** Applies the stored setting before the first paint. Call once, from `main.tsx`. */
export function initReducedMotion(): void {
  applyReducedMotion(isEnabled);
}
