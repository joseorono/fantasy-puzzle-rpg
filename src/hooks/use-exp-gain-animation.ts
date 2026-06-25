import { useEffect, useState } from 'react';
import type { ExpGainTimeline } from '~/lib/leveling-system';

/** Milliseconds of fill time per percent travelled (a full 0→100 fill ≈ 600ms before clamping). */
const FILL_MS_PER_PERCENT = 6;
/** Clamp so tiny fills still read and huge multi-level chains stay snappy. */
const MIN_SEGMENT_MS = 250;
const MAX_SEGMENT_MS = 600;
/** How long the bar holds at 100% (badge popped) before resetting for the next level. */
const LEVEL_UP_PAUSE_MS = 320;

/** Ease-out so each fill decelerates as it lands. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface ExpGainAnimationState {
  /** Current bar fill (0–100). */
  percentage: number;
  /** Currently displayed level (ticks up as the bar crosses each threshold). */
  level: number;
  /** Increments on every level-up — use as a React `key` to re-trigger the badge pop. */
  badgeKey: number;
  /** True once at least one level-up has occurred (gates the badge). */
  hasLeveledUp: boolean;
  /** True once the whole timeline has finished animating. */
  isComplete: boolean;
}

/**
 * Drives a single character's EXP-bar animation from a pre-computed {@link ExpGainTimeline}.
 * Fills the bar to its real position; on each level crossing it fills to 100%, pops the
 * badge, holds briefly, resets to 0%, and refills — once per level gained.
 *
 * Honours `prefers-reduced-motion` by jumping straight to the final state.
 *
 * @param timeline - The pure animation timeline for this character (stable identity expected)
 * @returns The live animation state to render
 */
export function useExpGainAnimation(timeline: ExpGainTimeline): ExpGainAnimationState {
  const [state, setState] = useState<ExpGainAnimationState>(() => ({
    percentage: timeline.segments[0]?.fromPercent ?? 0,
    level: timeline.startLevel,
    badgeKey: 0,
    hasLeveledUp: false,
    isComplete: timeline.segments.length === 0,
  }));

  useEffect(() => {
    const segments = timeline.segments;
    if (segments.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      const last = segments[segments.length - 1];
      setState({
        percentage: last.toPercent,
        level: timeline.startLevel + timeline.totalLevelUps,
        badgeKey: timeline.totalLevelUps,
        hasLeveledUp: timeline.totalLevelUps > 0,
        isComplete: true,
      });
      return;
    }

    let rafId = 0;
    let cancelled = false;
    let segmentIndex = 0;
    let levelUpsSoFar = 0;
    let segmentStart = -1;
    let pauseUntil = 0;

    const step = (now: number) => {
      if (cancelled) return;
      const segment = segments[segmentIndex];

      // Hold at 100% after a level-up so the badge pop reads, then reset for the next level.
      if (pauseUntil > 0) {
        if (now < pauseUntil) {
          rafId = requestAnimationFrame(step);
          return;
        }
        pauseUntil = 0;
        segmentStart = now;
        setState((prev) => ({ ...prev, percentage: segment.fromPercent }));
      }

      if (segmentStart < 0) segmentStart = now;

      const span = Math.abs(segment.toPercent - segment.fromPercent);
      const duration = Math.min(MAX_SEGMENT_MS, Math.max(MIN_SEGMENT_MS, span * FILL_MS_PER_PERCENT));
      const t = Math.min(1, (now - segmentStart) / duration);
      const percentage = segment.fromPercent + (segment.toPercent - segment.fromPercent) * easeOutCubic(t);

      if (t < 1) {
        setState((prev) => ({ ...prev, percentage }));
        rafId = requestAnimationFrame(step);
        return;
      }

      // Segment finished.
      if (segment.levelsUp) {
        levelUpsSoFar += 1;
        setState((prev) => ({
          ...prev,
          percentage: 100,
          level: segment.level + 1,
          badgeKey: levelUpsSoFar,
          hasLeveledUp: true,
        }));
        segmentIndex += 1;
        if (segmentIndex >= segments.length) {
          setState((prev) => ({ ...prev, isComplete: true }));
          return;
        }
        // Hold at 100% for a beat; the pause branch resets the bar and starts the next fill.
        pauseUntil = now + LEVEL_UP_PAUSE_MS;
        segmentStart = -1;
        rafId = requestAnimationFrame(step);
        return;
      }

      // Final, non-level-up segment: settle at the real partial fill.
      setState((prev) => ({ ...prev, percentage: segment.toPercent, isComplete: true }));
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [timeline]);

  return state;
}
