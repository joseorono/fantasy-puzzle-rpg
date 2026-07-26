import { useRef, useState, useEffect } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { advanceFrame, type CharacterSpriteMode } from '~/lib/character-sprite';
import {
  WALK_FRAME_MS,
  RUN_FRAME_MS,
  SIT_FRAME_INTERVAL_MS,
  IDLE_SIT_DELAY_MS,
  MOVE_ANIMATION_WINDOW_MS,
} from '~/constants/character-sprite';

export interface SpriteState {
  mode: CharacterSpriteMode;
  facing: NavDirection;
  frameIndex: number;
}

export interface StepReport {
  moved: boolean;
  running: boolean;
}

/**
 * Manages the character sprite animation state machine.
 *
 * Lifecycle:
 *   walk/run → (idle MOVE_ANIMATION_WINDOW_MS) → stand
 *   stand → (idle IDLE_SIT_DELAY_MS) → sit
 *   sit → (any reportStep) → stand
 *
 * The hook tracks *when* animation ticks should happen and cleans up
 * intervals on unmount. No useMemo/useCallback — React Compiler.
 */
export function useCharacterSprite(): {
  spriteState: SpriteState;
  reportStep: (direction: NavDirection, step: StepReport) => void;
} {
  const [spriteState, setSpriteState] = useState<SpriteState>({
    mode: 'stand',
    facing: 'down',
    frameIndex: 0,
  });

  // Mutable refs for timers so we can clear them in effects and callbacks
  // without capturing stale closure values.
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sitDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sitToggleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hold the current active mode in a ref so timer callbacks read live values.
  const modeRef = useRef<CharacterSpriteMode>('stand');
  const facingRef = useRef<NavDirection>('down');
  const frameRef = useRef(0);

  // --- helpers to start/stop frame advancement ---
  function startFrameInterval(mode: CharacterSpriteMode) {
    stopFrameInterval();
    const ms = mode === 'run' ? RUN_FRAME_MS : WALK_FRAME_MS;
    frameIntervalRef.current = setInterval(() => {
      const next = advanceFrame(modeRef.current, frameRef.current);
      frameRef.current = next;
      setSpriteState({ mode: modeRef.current, facing: facingRef.current, frameIndex: next });
    }, ms);
  }

  function stopFrameInterval() {
    if (frameIntervalRef.current !== null) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }

  // --- helpers to manage idle → stand → sit chain ---
  function clearIdleChain() {
    if (moveWindowTimerRef.current !== null) {
      clearTimeout(moveWindowTimerRef.current);
      moveWindowTimerRef.current = null;
    }
    if (sitDelayTimerRef.current !== null) {
      clearTimeout(sitDelayTimerRef.current);
      sitDelayTimerRef.current = null;
    }
    if (sitToggleIntervalRef.current !== null) {
      clearInterval(sitToggleIntervalRef.current);
      sitToggleIntervalRef.current = null;
    }
  }

  function transitionTo(mode: CharacterSpriteMode, facing: NavDirection) {
    modeRef.current = mode;
    facingRef.current = facing;
    if (mode === 'stand' || mode === 'sit') {
      frameRef.current = 0;
    }
    setSpriteState({ mode, facing, frameIndex: frameRef.current });
  }

  function scheduleStandAfterWindow() {
    moveWindowTimerRef.current = setTimeout(() => {
      transitionTo('stand', facingRef.current);
      stopFrameInterval();

      // After standing still for IDLE_SIT_DELAY_MS, sit down.
      sitDelayTimerRef.current = setTimeout(() => {
        transitionTo('sit', facingRef.current);

        // In sit mode, toggle frames every SIT_FRAME_INTERVAL_MS.
        sitToggleIntervalRef.current = setInterval(() => {
          const next = advanceFrame('sit', frameRef.current);
          frameRef.current = next;
          setSpriteState({ mode: 'sit', facing: facingRef.current, frameIndex: next });
        }, SIT_FRAME_INTERVAL_MS);
      }, IDLE_SIT_DELAY_MS);
    }, MOVE_ANIMATION_WINDOW_MS);
  }

  // --- public API ---
  function reportStep(direction: NavDirection, step: StepReport) {
    const currentMode = modeRef.current;

    // Any input during sit → stand up first.
    if (currentMode === 'sit') {
      clearIdleChain();
      stopFrameInterval();
    }

    // Always update facing.
    facingRef.current = direction;

    if (step.moved) {
      const newMode = step.running ? 'run' : 'walk';
      transitionTo(newMode, direction);
      startFrameInterval(newMode);

      // Reset the idle chain — we just moved.
      clearIdleChain();
      scheduleStandAfterWindow();
    } else {
      // The character pressed a direction key but did not move.
      // Only update facing — do NOT reset the idle chain.
      // The stand/sit timers continue from their existing countdown.
      setSpriteState({ mode: modeRef.current, facing: direction, frameIndex: frameRef.current });
    }
  }

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopFrameInterval();
      clearIdleChain();
    };
  }, []);

  return { spriteState, reportStep };
}
