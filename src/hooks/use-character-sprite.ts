import { useRef, useState, useEffect } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { advanceFrame, type CharacterSpriteMode } from '~/lib/character-sprite';
import { getMemaoStepDurationMs } from '~/lib/memao-sprite';
import {
  CHARACTER_MODE_ANIMATION,
  CHARACTER_READING_FACING,
  IDLE_SIT_DELAY_MS,
} from '~/constants/character-sprite';

export interface SpriteState {
  mode: CharacterSpriteMode;
  facing: NavDirection;
  frameIndex: number;
}

/**
 * Holds the character's sprite animation state.
 *
 * Walk and run frames are *pushed in* by the movement loop, which derives them
 * from distance travelled — this hook does not run a frame timer for them, so
 * the cycle can never drift out of phase with the character's actual speed.
 *
 * The only timers here are the idle chain:
 *   stand (idle loop) → (IDLE_SIT_DELAY_MS) → sit (plays once, holds its last frame)
 * Frame timings come from the Memao animation definitions. Any movement cancels the
 * chain and stands the character back up.
 *
 * Reading (`setReading`) is a pose held from outside, e.g. while the map overview is
 * open: the character turns to the camera and loops the read animation, ignoring the
 * movement loop until reading ends and her previous facing is restored.
 */
/** Modes the movement loop may drive. `sit` and `read` are owned by this hook. */
export type DrivenSpriteMode = Exclude<CharacterSpriteMode, 'sit' | 'read'>;

export function useCharacterSprite(): {
  spriteState: SpriteState;
  updateSprite: (mode: DrivenSpriteMode, facing: NavDirection, frameIndex: number) => void;
  setReading: (isReading: boolean) => void;
} {
  const [spriteState, setSpriteState] = useState<SpriteState>({
    mode: 'stand',
    facing: 'down',
    frameIndex: 0,
  });

  // Mirrors `spriteState` so the rAF loop can compare without re-subscribing.
  const currentRef = useRef<SpriteState>(spriteState);
  const sitDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Where the character faced before turning to read, restored when she stops.
  const facingBeforeReadingRef = useRef<NavDirection | null>(null);

  function clearFrameTimer() {
    if (frameTimerRef.current !== null) {
      clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }

  function clearIdleChain() {
    if (sitDelayTimerRef.current !== null) {
      clearTimeout(sitDelayTimerRef.current);
      sitDelayTimerRef.current = null;
    }
    clearFrameTimer();
  }

  function commit(next: SpriteState) {
    currentRef.current = next;
    setSpriteState(next);
  }

  /** Steps the current timed mode (stand, sit or read) until it loops forever or holds. */
  function playTimedFrames() {
    const { mode, frameIndex } = currentRef.current;
    frameTimerRef.current = setTimeout(
      () => {
        const previous = currentRef.current;
        const nextFrame = advanceFrame(previous.mode, previous.frameIndex);
        if (nextFrame === previous.frameIndex) {
          frameTimerRef.current = null;
          return;
        }
        commit({ ...previous, frameIndex: nextFrame });
        playTimedFrames();
      },
      getMemaoStepDurationMs(CHARACTER_MODE_ANIMATION[mode], frameIndex),
    );
  }

  /** Starts the idle loop for a freshly committed stand, and arms the sit countdown. */
  function startIdleChain() {
    clearIdleChain();
    playTimedFrames();
    sitDelayTimerRef.current = setTimeout(() => {
      sitDelayTimerRef.current = null;
      clearFrameTimer();
      commit({ mode: 'sit', facing: currentRef.current.facing, frameIndex: 0 });
      playTimedFrames();
    }, IDLE_SIT_DELAY_MS);
  }

  /**
   * Sets the sprite frame. Called every animation frame by the movement loop —
   * it no-ops when nothing changed, so React only re-renders on a real frame
   * change (roughly eight times a second while walking).
   *
   * Passing `stand` means "not moving"; it does not disturb an in-progress idle or
   * sit, which is why the idle chain can survive the loop's per-frame calls.
   */
  function updateSprite(mode: DrivenSpriteMode, facing: NavDirection, frameIndex: number): void {
    const previous = currentRef.current;
    // Reading is held from outside; the loop's per-frame `stand` calls must not end it.
    if (previous.mode === 'read') return;

    if (mode === 'stand') {
      if (previous.mode === 'sit') {
        // Stay seated until the player actually turns or moves.
        if (previous.facing === facing) return;
        commit({ mode: 'stand', facing, frameIndex: 0 });
        startIdleChain();
        return;
      }

      if (previous.mode !== 'stand') {
        commit({ mode: 'stand', facing, frameIndex: 0 });
        startIdleChain();
        return;
      }

      // Turning in place while already standing must not delay sitting down.
      if (previous.facing !== facing) {
        commit({ ...previous, facing });
      }
      return;
    }

    // walk / run — any movement cancels the idle chain.
    if (previous.mode === 'stand' || previous.mode === 'sit') {
      clearIdleChain();
    }

    if (previous.mode === mode && previous.facing === facing && previous.frameIndex === frameIndex) {
      return;
    }

    commit({ mode, facing, frameIndex });
  }

  /**
   * Starts or ends the reading pose. Starting turns the character to the camera and
   * loops the read animation; ending restores her facing and the idle chain.
   */
  function setReading(isReading: boolean): void {
    const previous = currentRef.current;

    if (isReading) {
      if (previous.mode === 'read') return;
      facingBeforeReadingRef.current = previous.facing;
      clearIdleChain();
      commit({ mode: 'read', facing: CHARACTER_READING_FACING, frameIndex: 0 });
      playTimedFrames();
      return;
    }

    if (previous.mode !== 'read') return;
    commit({ mode: 'stand', facing: facingBeforeReadingRef.current ?? previous.facing, frameIndex: 0 });
    facingBeforeReadingRef.current = null;
    startIdleChain();
  }

  // Start the idle chain for the initial stand, and clean up on unmount.
  useEffect(() => {
    startIdleChain();
    return clearIdleChain;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { spriteState, updateSprite, setReading };
}
