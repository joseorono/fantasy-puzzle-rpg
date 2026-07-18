import { useState } from 'react';
import AudioLicensesDialogContent from '~/components/licenses/audio-licenses';
import GraphicsLicensesDialogContent from '~/components/licenses/graphics-licenses';
import LinksToLicensesDialogContent from '~/components/licenses/links-to-licenses';
import { ToffecCloseButton } from '~/components/ui-custom/toffec-close-button';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { RetroDivider } from '~/components/dividers/retro-divider';
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

type CreditsSection = 'menu' | 'graphics' | 'audio';

const SECTION_TITLES: Record<CreditsSection, string> = {
  menu: 'Credits',
  graphics: 'Graphics Credits',
  audio: 'Audio Credits',
};

/**
 * Reusable credits/licenses modal. Reuses the start-menu modal panel visuals but with a
 * fixed, viewport-covering backdrop so it can be opened from any screen — the title menu
 * or the debug view. Shows a small menu with Graphics/Audio choices (local state only,
 * one section visible at a time) with a back button to return to the menu. The actual
 * attribution text lives in the `licenses/*` content components, so this component is
 * only responsible for the modal chrome and navigation.
 */
export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [section, setSection] = useState<CreditsSection>('menu');

  const handleClose = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    onClose();
    setSection('menu');
  };

  const handleOpenSection = (nextSection: CreditsSection) => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setSection(nextSection);
  };

  const handleBack = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setSection('menu');
  };

  // Escape backs out of a section first, then closes the modal (only wired while it is open).
  useWindowKeyDown((event) => {
    if (event.key === KeyboardKeys.Escape) {
      event.preventDefault();
      if (section !== 'menu') {
        handleBack();
      } else {
        handleClose();
      }
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
          <div className="credits-modal-header-slot credits-modal-header-slot--left">
            {section !== 'menu' && (
              <ToffecButton variant="cream" size="xs" onClick={handleBack} className="credits-modal-back">
                <img src="/assets/icons/indigolay/Icon_move-to-start.png" alt="" className="credits-modal-nav-icon" draggable={false} />
                Back
              </ToffecButton>
            )}
          </div>
          <h2 className={`start-menu-modal-title ${section !== 'menu' ? 'credits-modal-title--back' : ''}`}>
            <NarikWoodBitFont text={SECTION_TITLES[section]} size={0.9} />
          </h2>
          <div className="credits-modal-header-slot credits-modal-header-slot--right">
            <ToffecCloseButton variant="medieval1" hasBg size="sm" onClick={handleClose} />
          </div>
        </div>

        {/* Divider */}
        <RetroDivider variant="victory" />

        {/* Content — only the active section is rendered */}
        <div className="start-menu-modal-body credits-modal-body">
          {section === 'menu' && (
            <div className="credits-modal-menu">
              <ToffecBeigeCornersWrapper>
                <ToffecButton variant="cream" size="default" onClick={() => handleOpenSection('graphics')}>
                  <img src="/assets/icons/indigolay/Icon_file-media.png" alt="" className="credits-modal-nav-icon" draggable={false} />
                  Graphics
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
              <ToffecBeigeCornersWrapper>
                <ToffecButton variant="cream" size="default" onClick={() => handleOpenSection('audio')}>
                  <img src="/assets/icons/indigolay/icon-unmute.png" alt="" className="credits-modal-nav-icon" draggable={false} />
                  Audio
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          )}

          {section === 'graphics' && (
            <>
              <GraphicsLicensesDialogContent />
              <LinksToLicensesDialogContent />
            </>
          )}

          {section === 'audio' && (
            <>
              <AudioLicensesDialogContent />
              <LinksToLicensesDialogContent />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
