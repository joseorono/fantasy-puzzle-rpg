import { useEffect, useCallback } from "react";
import type { DialogueScene as DialogueSceneType } from "~/types/dialogue";
import { useDialogue } from "~/hooks/use-dialogue";
import { DialogueBox } from "./dialogue-box";
import { DialoguePortrait } from "./dialogue-portrait";

interface DialogueSceneProps {
  scene: DialogueSceneType;
  onComplete?: () => void;
  textSpeed?: number;
  turboSpeed?: number;
}

export function DialogueScene({
  scene,
  onComplete,
  textSpeed = 2,
  turboSpeed = 10,
}: DialogueSceneProps) {
  const {
    currentLine,
    displayedText,
    isTyping,
    isComplete,
    isLast,
    isCtrlPressed,
    next,
  } = useDialogue(scene, { textSpeed, turboSpeed });

  // Handle click/space/enter to advance
  const handleAdvance = useCallback(() => {
    if (isLast && isComplete && onComplete) {
      onComplete();
    } else {
      next();
    }
  }, [isLast, isComplete, onComplete, next]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleAdvance();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdvance]);

  if (!currentLine) return null;

  // Find the current speaker
  const currentSpeaker = scene.characters.find(
    (char) => char.id === currentLine.speakerId
  );

  // Organize portraits by side
  const leftPortraits = scene.characters.filter(
    (char) => char.side === "left" && char.portrait
  );
  const rightPortraits = scene.characters.filter(
    (char) => char.side === "right" && char.portrait
  );
  const centerPortraits = scene.characters.filter(
    (char) => char.side === "center" && char.portrait
  );

  return (
    <>
      {/* Dark backdrop */}
      <div className="dialogue-backdrop" onClick={handleAdvance} />

      {/* Dialogue container */}
      <div className="dialogue-container">
        {/* CTRL skip indicator */}
        {isCtrlPressed && (
          <div className="dialogue-skip-indicator">Fast Forward</div>
        )}

        {/* Portraits */}
        <div className="dialogue-portraits">
          {/* Left portraits */}
          {leftPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={
                char.id === currentLine.speakerId
                  ? currentLine.emotion
                  : undefined
              }
            />
          ))}

          {/* Center portraits */}
          {centerPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={
                char.id === currentLine.speakerId
                  ? currentLine.emotion
                  : undefined
              }
            />
          ))}

          {/* Right portraits */}
          {rightPortraits.map((char) => (
            <DialoguePortrait
              key={char.id}
              character={char}
              isActive={char.id === currentLine.speakerId}
              emotion={
                char.id === currentLine.speakerId
                  ? currentLine.emotion
                  : undefined
              }
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
        />
      </div>
    </>
  );
}
