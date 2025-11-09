import { useState, useCallback, useEffect, useRef } from 'react';
import type { DialogueScene, DialogueLine } from '../types/dialogue';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
interface UseDialogueOptions {
  textSpeed?: number; // Characters per frame (default: 2)
  turboSpeed?: number; // Characters per frame when CTRL held (default: 10)
  autoAdvanceDelay?: number; // ms to wait before auto-advancing (0 = disabled)
  controlsEnabled?: boolean; // when false, ignore input like CTRL fast-forward
}

export function useDialogue(scene: DialogueScene, options: UseDialogueOptions = {}) {
  const { textSpeed = 2, turboSpeed = 10, autoAdvanceDelay = 0, controlsEnabled = true } = options;

  const [index, setIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  const currentLine: DialogueLine | undefined = scene.lines[index];
  const isLast = index === scene.lines.length - 1;
  const isComplete = displayedText === currentLine?.text;

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const charIndexRef = useRef<number>(0);

  // Handle CTRL key press for fast-forward
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Control') {
        if (!controlsEnabled) return;
        setIsCtrlPressed(true);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlsEnabled]);

  // If controls get disabled, ensure CTRL state is cleared
  useEffect(() => {
    if (!controlsEnabled && isCtrlPressed) {
      setIsCtrlPressed(false);
    }
  }, [controlsEnabled, isCtrlPressed]);

  // Typewriter animation
  useEffect(() => {
    if (!currentLine) return;

    const lineText = currentLine.text;

    // Reset for new line
    setDisplayedText('');
    setIsTyping(true);
    charIndexRef.current = 0;
    lastUpdateRef.current = performance.now();

    function animate(timestamp: number) {
      const deltaTime = timestamp - lastUpdateRef.current;
      const currentSpeed = controlsEnabled && isCtrlPressed ? turboSpeed : textSpeed;

      // Update every ~16ms (60fps), but add multiple characters based on speed
      if (deltaTime >= 16) {
        const charsToAdd = Math.floor(currentSpeed);
        const newIndex = Math.min(charIndexRef.current + charsToAdd, lineText.length);

        setDisplayedText(lineText.slice(0, newIndex));
        charIndexRef.current = newIndex;
        lastUpdateRef.current = timestamp;

        if (newIndex >= lineText.length) {
          setIsTyping(false);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentLine, textSpeed, turboSpeed, controlsEnabled]);

  const next = useCallback(() => {
    if (!isComplete) {
      // Skip to end of current text
      setDisplayedText(currentLine?.text || '');
      setIsTyping(false);
      charIndexRef.current = currentLine?.text.length || 0;
    } else if (!isLast) {
      // Move to next line
      setIndex((i) => Math.min(i + 1, scene.lines.length - 1));
      soundService.playSound(SoundNames.mechanicalClick);
    }
  }, [isComplete, isLast, currentLine, scene.lines.length]);

  // Auto-advance when CTRL is held and line is complete
  useEffect(() => {
    if (controlsEnabled && isCtrlPressed && isComplete && !isLast) {
      const timer = setTimeout(() => {
        next();
      }, 100); // Small delay to prevent jarring instant transitions

      return () => clearTimeout(timer);
    }
  }, [controlsEnabled, isCtrlPressed, isComplete, isLast, next]);

  // Auto-advance after delay (if enabled)
  useEffect(() => {
    if (autoAdvanceDelay > 0 && isComplete && !isLast) {
      const timer = setTimeout(() => {
        next();
      }, autoAdvanceDelay);

      return () => clearTimeout(timer);
    }
  }, [autoAdvanceDelay, isComplete, isLast, next]);

  const skip = useCallback(() => {
    // Skip to last line and complete text
    const lastIndex = scene.lines.length - 1;
    setIndex(lastIndex);
    setDisplayedText(scene.lines[lastIndex].text);
    setIsTyping(false);
  }, [scene.lines]);

  const reset = useCallback(() => {
    setIndex(0);
    setDisplayedText('');
    setIsTyping(false);
    charIndexRef.current = 0;
  }, []);

  return {
    currentLine,
    displayedText,
    index,
    isTyping,
    isComplete,
    isLast,
    isCtrlPressed,
    next,
    skip,
    reset,
  };
}
