import { ArrowUpIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

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
      {speakerName && <div className="dialogue-box__speaker">{speakerName}</div>}
      <div className="dialogue-box__text">
        {text}
        {isTyping && <span className="dialogue-box__cursor" />}
      </div>
      <div className="dialogue-box__footer">
        {!isTyping && showIndicator && <div className="dialogue-box__indicator" aria-label="Continue" />}
        {onOpenHistory && (
          <Tooltip>
            <TooltipTrigger>
              <ToffecButton
                variant="cream"
                size="sm"
                className="dialogue-box__history-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory();
                }}
              >
                <ArrowUpIcon className="h-4 w-4" />
                Message Log
              </ToffecButton>
            </TooltipTrigger>
            <TooltipContent>Message History (scroll up)</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
