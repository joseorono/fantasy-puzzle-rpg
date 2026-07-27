import { useRef, useState, useEffect } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { advanceFrame, type CharacterSpriteMode } from '~/lib/character-sprite';
import { SIT_FRAME_INTERVAL_MS, IDLE_SIT_DELAY_MS } from '~/constants/character-sprite';

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
 *   stand → (IDLE_SIT_DELAY_MS) → sit → (toggles every SIT_FRAME_INTERVAL_MS)
 * Any movement cancels it and stands the character back up.
 */
/** Modes the movement loop may drive. `sit` is owned by this hook's idle timer. */
export type DrivenSpriteMode = Exclude<CharacterSpriteMode, 'sit'>;

export function useCharacterSprite(): {
  spriteState: SpriteState;
  updateSprite: (mode: DrivenSpriteMode, facing: NavDirection, frameIndex: number) => void;
} {
  const [spriteState, setSpriteState] = useState<SpriteState>({
    mode: 'stand',
    facing: 'down',
    frameIndex: 0,
  });

  // Mirrors `spriteState` so the rAF loop can compare without re-subscribing.
  const currentRef = useRef<SpriteState>(spriteState);
  const sitDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sitToggleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearIdleChain() {
    if (sitDelayTimerRef.current !== null) {
      clearTimeout(sitDelayTimerRef.current);
      sitDelayTimerRef.current = null;
    }
    if (sitToggleIntervalRef.current !== null) {
      clearInterval(sitToggleIntervalRef.current);
      sitToggleIntervalRef.current = null;
    }
  }

  function commit(next: SpriteState) {
    currentRef.current = next;
    setSpriteState(next);
  }

  function scheduleSit() {
    clearIdleChain();
    sitDelayTimerRef.current = setTimeout(() => {
      commit({ mode: 'sit', facing: currentRef.current.facing, frameIndex: 0 });

      sitToggleIntervalRef.current = setInterval(() => {
        const previous = currentRef.current;
        commit({ ...previous, frameIndex: advanceFrame('sit', previous.frameIndex) });
      }, SIT_FRAME_INTERVAL_MS);
    }, IDLE_SIT_DELAY_MS);
  }

  /**
   * Sets the sprite frame. Called every animation frame by the movement loop —
   * it no-ops when nothing changed, so React only re-renders on a real frame
   * change (roughly nine times a second while walking).
   *
   * Passing `stand` means "not moving"; it does not disturb an in-progress sit,
   * which is why the idle chain can survive the loop's per-frame calls.
   */
  function updateSprite(mode: DrivenSpriteMode, facing: NavDirection, frameIndex: number): void {
    const previous = currentRef.current;

    if (mode === 'stand') {
      if (previous.mode === 'sit') {
        // Stay seated until the player actually turns or moves.
        if (previous.facing === facing) return;
        clearIdleChain();
        commit({ mode: 'stand', facing, frameIndex: 0 });
        scheduleSit();
        return;
      }

      if (previous.mode !== 'stand') {
        commit({ mode: 'stand', facing, frameIndex: 0 });
        scheduleSit();
        return;
      }

      // Turning in place while already standing must not delay sitting down.
      if (previous.facing !== facing) {
        commit({ mode: 'stand', facing, frameIndex: 0 });
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

  // Arm the sit countdown for the initial stand, and clean up on unmount.
  useEffect(() => {
    scheduleSit();
    return clearIdleChain;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { spriteState, updateSprite };
}
