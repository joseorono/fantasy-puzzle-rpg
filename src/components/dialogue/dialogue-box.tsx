import { ArrowUpIcon } from "lucide-react";

interface DialogueBoxProps {
  speakerName?: string;
  text: string;
  isTyping: boolean;
  showIndicator?: boolean;
  onClick?: () => void;
  onOpenHistory?: () => void;
}

export function DialogueBox({
  speakerName,
  text,
  isTyping,
  showIndicator = true,
  onClick,
  onOpenHistory,
}: DialogueBoxProps) {
  return (
    <div className="dialogue-box" onClick={onClick}>
      {speakerName && (
        <div className="dialogue-box__speaker">{speakerName}</div>
      )}
      <div className="dialogue-box__text">
        {text}
        {isTyping && <span className="dialogue-box__cursor" />}
      </div>
      <div className="dialogue-box__footer">
        {!isTyping && showIndicator && (
          <div className="dialogue-box__indicator" aria-label="Continue" />
        )}
        {onOpenHistory && (
          <button
            className="dialogue-box__button dialogue-box__history-button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistory();
            }}
            title="Open Message History (or scroll up)"
          >
            {/* TODO: Change this icon */}
            <ArrowUpIcon className="w-4 h-4" />
            Message Log
          </button>
        )}
      </div>
    </div>
  );
}
