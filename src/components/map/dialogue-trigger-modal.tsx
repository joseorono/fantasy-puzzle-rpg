import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

interface DialogueTriggerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Pixel-art styled confirmation modal shown when the player steps onto a
 * dialogue trigger tile. Reuses the NodeInteractionMenu visual language.
 */
export function DialogueTriggerModal({ isOpen, onAccept, onDecline }: DialogueTriggerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onDecline}
    >
      <div className="nim w-[320px]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nim-header">
          <div className="nim-icon-wrapper">
            <FrostyRpgIcon name="openBook" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="nim-title pixel-font">Event Discovered!</h2>
            <p className="nim-type pixel-font">Dialogue</p>
          </div>
        </div>

        {/* Description */}
        <div className="nim-description">
          <p>You've discovered something interesting. Would you like to investigate?</p>
        </div>

        {/* Actions */}
        <div className="nim-actions">
          <ToffecButton variant="cream" size="sm" className="nim-btn" onClick={onAccept}>
            <FrostyRpgIcon name="openBook" size={16} />
            Yes
          </ToffecButton>
          <ToffecButton variant="orange" size="sm" className="nim-btn" onClick={onDecline}>
            No
          </ToffecButton>
        </div>
      </div>
    </div>
  );
}
