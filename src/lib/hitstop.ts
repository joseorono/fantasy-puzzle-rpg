/**
 * Battle "hitstop": a brief freeze-frame at the moment a hit lands, to give attacks weight.
 *
 * Purely visual — it pauses CSS animations on `#game-screen` and applies a micro scale punch
 * via the `.hitstop-freeze` class, then removes it after `durationMs`. It deliberately does NOT
 * touch the JS timers driving combat (the 100ms cooldown tick, per-enemy attack intervals, or
 * the 200/600/1100ms cascade chain), so it can never desync resolution.
 */
import { HITSTOP_DURATION_MS } from '~/constants/animation-system';

const HITSTOP_CLASS = 'hitstop-freeze';

let hitstopTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Freeze the game screen for a moment. Idempotent and self-cleaning: a fresh call restarts the
 * timer rather than stacking. No-ops when there is no DOM or the user prefers reduced motion.
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
