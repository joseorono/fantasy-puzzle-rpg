/**
 * Animation strategy system for global animations.
 * Supports different implementation approaches:
 * - Overlay: Apply class to fixed overlay div
 * - GameScreen: Apply class to #game-screen element
 */
import { ANIMATION_CONFIG, HITSTOP_DURATION_MS, type GlobalAnimationType } from '~/constants/animation-system';

/**
 * Apply animation class to the appropriate element based on strategy
 */
export function applyAnimation(type: GlobalAnimationType, overlayRef: HTMLDivElement | null): void {
  const config = ANIMATION_CONFIG[type];

  if (config.strategy === 'overlay') {
    if (overlayRef) {
      overlayRef.classList.add(config.className);
    }
  } else if (config.strategy === 'game-screen') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.add(config.className);
    }
  }
}

/**
 * Remove animation class from the appropriate element
 */
export function removeAnimation(type: GlobalAnimationType, overlayRef: HTMLDivElement | null): void {
  const config = ANIMATION_CONFIG[type];

  if (config.strategy === 'overlay') {
    if (overlayRef) {
      overlayRef.classList.remove(config.className);
    }
  } else if (config.strategy === 'game-screen') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.remove(config.className);
    }
  }
}

/**
 * Get animation duration for a given type
 */
export function getAnimationDuration(type: GlobalAnimationType): number {
  return ANIMATION_CONFIG[type].duration;
}

const HITSTOP_CLASS = 'hitstop-freeze';
let hitstopTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Battle "hitstop": a brief freeze-frame at the moment a hit lands, to give attacks weight.
 *
 * Purely visual — adds `.hitstop-freeze` to `#game-screen`, which pauses descendant CSS
 * animations and applies a micro scale punch, then removes it after `durationMs`. It does NOT
 * touch the JS timers driving combat (the 100ms cooldown tick, per-enemy attack intervals, or
 * the 200/600/1100ms cascade chain), so it can never desync resolution. Idempotent and
 * self-cleaning: a fresh call restarts the timer rather than stacking. No-ops when there is no
 * DOM or the user prefers reduced motion.
 *
 * @param durationMs - How long to hold the freeze, in milliseconds.
 */
export function triggerHitstop(durationMs: number = HITSTOP_DURATION_MS): void {
  if (typeof document === 'undefined') return;

  // Reduced-motion users opt out of the freeze entirely (CSS alone can't stop us adding the class).
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const gameScreen = document.getElementById('game-screen');
  if (!gameScreen) return;

  gameScreen.classList.add(HITSTOP_CLASS);

  if (hitstopTimer) clearTimeout(hitstopTimer);
  hitstopTimer = setTimeout(() => {
    gameScreen.classList.remove(HITSTOP_CLASS);
    hitstopTimer = null;
  }, durationMs);
}
