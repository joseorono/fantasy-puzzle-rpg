import AudioLicensesDialogContent from '~/components/licenses/audio-licenses';
import GraphicsLicensesDialogContent from '~/components/licenses/graphics-licenses';
import LinksToLicensesDialogContent from '~/components/licenses/links-to-licenses';
import { ToffecCloseButton } from '~/components/ui-custom/toffec-close-button';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { KeyboardKeys } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';

interface CreditsModalProps {
  /** Whether the modal is visible. Rendering is skipped entirely when closed. */
  isOpen: boolean;
  /** Called when the player dismisses the modal (close button, backdrop, or Escape). */
  onClose: () => void;
}

/**
 * Reusable credits/licenses modal. Reuses the start-menu modal panel visuals but with a
 * fixed, viewport-covering backdrop so it can be opened from any screen — the title menu
 * or the debug view. The actual attribution text lives in the `licenses/*` content
 * components, so this component is only responsible for the modal chrome.
 */
export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const handleClose = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    onClose();
  };

  // Escape closes the modal (only wired while it is open).
  useWindowKeyDown((event) => {
    if (event.key === KeyboardKeys.Escape) {
      event.preventDefault();
      handleClose();
    }
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="start-menu-modal-backdrop credits-modal-backdrop" onClick={handleClose}>
      <div className="start-menu-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Golden frame corner decorations */}
        <div className="start-menu-modal-corner start-menu-modal-corner--tl" />
        <div className="start-menu-modal-corner start-menu-modal-corner--tr" />
        <div className="start-menu-modal-corner start-menu-modal-corner--bl" />
        <div className="start-menu-modal-corner start-menu-modal-corner--br" />

        {/* Header bar */}
        <div className="start-menu-modal-header">
          <h2 className="start-menu-modal-title">
            <NarikWoodBitFont text="Credits" size={0.9} />
          </h2>
          <ToffecCloseButton variant="medieval1" hasBg size="sm" onClick={handleClose} />
        </div>

        {/* Divider */}
        <div className="start-menu-modal-divider" />

        {/* Content — all licenses/attributions stacked and scrollable */}
        <div className="start-menu-modal-body credits-modal-body">
          <AudioLicensesDialogContent />
          <GraphicsLicensesDialogContent />
          <LinksToLicensesDialogContent />
        </div>
      </div>
    </div>
  );
}
