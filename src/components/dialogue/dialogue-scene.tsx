import { useEffect, useCallback, useState } from 'react';
import { useSetAtom } from 'jotai';
import type { DialogueScene as DialogueSceneType } from '~/types/dialogue';
import { isDialogueActiveAtom } from '~/stores/dialogue-atoms';
import { useDialogue } from '~/hooks/use-dialogue';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { KeyboardKeys, isConfirmKey } from '~/constants/keyboard';
import { DialogueBox } from './dialogue-box';
import { DialoguePortrait } from './dialogue-portrait';
import { MessageHistory } from './message-history';

interface DialogueSceneProps {
  scene: DialogueSceneType;
  onComplete?: () => void;
  textSpeed?: number;
  turboSpeed?: number;
}

export function DialogueScene({ scene, onComplete, textSpeed = 2, turboSpeed = 10 }: DialogueSceneProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { currentLine, displayedText, isTyping, isComplete, isLast, isCtrlPressed, next, index } = useDialogue(scene, {
    textSpeed,
    turboSpeed,
    controlsEnabled: !isHistoryOpen,
  });

  // Handle click/space/enter to advance
  const handleAdvance = useCallback(() => {
    if (isLast && isComplete && onComplete) {
      onComplete();
    } else {
      next();
    }
  }, [isLast, isComplete, onComplete, next]);

  const setDialogueActive = useSetAtom(isDialogueActiveAtom);

  // Flag dialogue as active (blocks the pause menu) and add the body class that
  // prevents page scrolling, for as long as a scene is mounted.
  useEffect(() => {
    setDialogueActive(true);
    document.body.classList.add('dialogue-active');
    return () => {
      setDialogueActive(false);
      document.body.classList.remove('dialogue-active');
    };
  }, [setDialogueActive]);

  // Keyboard controls
  useWindowKeyDown((e) => {
    // When history is open: prevent dialogue advancement and allow ESC to close
    if (isHistoryOpen) {
      if (e.key === KeyboardKeys.Escape) {
        e.preventDefault();
        closeHistory();
      }
      // Block SPACE/ENTER from advancing while history is open
      if (isConfirmKey(e.key)) {
        e.preventDefault();
      }
      return;
    }

    // Normal controls when history is not open
    if (isConfirmKey(e.key)) {
      e.preventDefault();
      handleAdvance();
    }
  });

  // Scroll wheel detection to open message history
  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      // Only open on scroll up (negative deltaY)
      if (e.deltaY < 0 && !isHistoryOpen) {
        e.preventDefault();
        setIsHistoryOpen(true);
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isHistoryOpen]);

  function closeHistory() {
    setIsHistoryOpen(false);
  }

  if (!currentLine) return null;

  // Find the current speaker
  const currentSpeaker = scene.characters.find((char) => char.id === currentLine.speakerId);

  // Organize portraits by side
  const leftPortraits = scene.characters.filter((char) => char.side === 'left' && char.portrait);
  const rightPortraits = scene.characters.filter((char) => char.side === 'right' && char.portrait);
  const centerPortraits = scene.characters.filter((char) => char.side === 'center' && char.portrait);

  return (
    <>
      {/* Message History */}
      <MessageHistory
        lines={scene.lines}
        characters={scene.characters}
        currentIndex={index}
        isOpen={isHistoryOpen}
        onClose={closeHistory}
      />

      {/* Dark backdrop */}
      <div className="dialogue-backdrop" onClick={handleAdvance} />

      {/* Dialogue container */}
      <div className="dialogue-container">
        {/* CTRL skip indicator */}
        {isCtrlPressed && <div className="dialogue-skip-indicator">Fast Forward</div>}

        {/* Portraits */}
        <div className="dialogue-portraits">
          {/* Left portraits */}
          {leftPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={char.id === currentLine.speakerId ? currentLine.emotion : undefined}
              showPortrait={currentLine.speakerId === char.id ? currentLine.showPortrait !== false : true}
              rotate90deg={currentLine.speakerId === char.id ? currentLine.rotate90deg === true : false}
            />
          ))}

          {/* Center portraits */}
          {centerPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={char.id === currentLine.speakerId ? currentLine.emotion : undefined}
              showPortrait={currentLine.speakerId === char.id ? currentLine.showPortrait !== false : true}
              rotate90deg={currentLine.speakerId === char.id ? currentLine.rotate90deg === true : false}
            />
          ))}

          {/* Right portraits */}
          {rightPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={char.id === currentLine.speakerId ? currentLine.emotion : undefined}
              showPortrait={currentLine.speakerId === char.id ? currentLine.showPortrait !== false : true}
              rotate90deg={currentLine.speakerId === char.id ? currentLine.rotate90deg === true : false}
            />
          ))}
        </div>

        {/* Dialogue box */}
        <DialogueBox
          speakerName={currentSpeaker?.name}
          text={displayedText}
          isTyping={isTyping}
          showIndicator={isComplete}
          onClick={handleAdvance}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
      </div>
    </>
  );
}
