interface DialogueBoxProps {
  speakerName?: string;
  text: string;
  isTyping: boolean;
  showIndicator?: boolean;
  onClick?: () => void;
}

export function DialogueBox({
  speakerName,
  text,
  isTyping,
  showIndicator = true,
  onClick,
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
      {!isTyping && showIndicator && (
        <div className="dialogue-box__indicator" aria-label="Continue" />
      )}
    </div>
  );
}
