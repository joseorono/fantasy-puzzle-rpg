import { useEffect, useRef } from "react";
import type { DialogueLine, DialogueCharacter } from "~/types/dialogue";
import { MAX_MESSAGE_HISTORY } from "~/constants/dialogue";

interface MessageHistoryProps {
  lines: DialogueLine[];
  characters: DialogueCharacter[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MessageHistory({
  lines,
  characters,
  currentIndex,
  isOpen,
  onClose,
}: MessageHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll mh-content to the bottom when opened so the user sees the latest message first
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // NOTE: mh-content is the scrollable element, not the container
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get up to MAX_MESSAGE_HISTORY previous messages from current index
  const startIndex = Math.max(0, currentIndex - MAX_MESSAGE_HISTORY + 1);
  const historyLines = lines.slice(startIndex, currentIndex + 1);

  // Helper to get character name by speaker ID
  function getSpeakerName(speakerId: string): string | undefined {
    return characters.find((char) => char.id === speakerId)?.name;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="mh-backdrop" onClick={onClose} />

      {/* Message History Container */}
      <div className="mh-container" ref={containerRef}>
        <div className="mh-header">
          <h2 className="mh-title">Message History</h2>
          <button className="mh-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mh-content" ref={contentRef}>
          {historyLines.map((line, idx) => {
            const speakerName = getSpeakerName(line.speakerId);
            const isNarration = !speakerName;
            const prevLine = idx > 0 ? historyLines[idx - 1] : null;
            const prevSpeakerName = prevLine
              ? getSpeakerName(prevLine.speakerId)
              : null;
            const isNarrationAfterDialogue = isNarration && prevSpeakerName;

            return (
              <div
                key={line.id}
                className={`mh-message ${
                  isNarration ? "mh-narration" : "mh-dialogue"
                } ${isNarrationAfterDialogue ? "mh-narration--after-dialogue" : ""}`}
              >
                {speakerName && (
                  <div className="mh-dialogue-name">{speakerName}</div>
                )}
                <div
                  className={
                    isNarration ? "mh-narration-text" : "mh-dialogue-message"
                  }
                >
                  {line.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
