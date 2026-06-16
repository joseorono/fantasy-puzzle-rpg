import { useState, useEffect } from 'react';
import { PauseMenuOptions } from './pause-menu/tabs/pause-menu-options';
import { PauseMenuLoad } from './pause-menu/tabs/pause-menu-load';
import { PauseMenuSave } from './pause-menu/tabs/pause-menu-save';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { Play, FolderOpen } from 'lucide-react';
import { ToffecCloseButton } from '~/components/ui-custom/toffec-close-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

interface StartMenuModalProps {
  onStartGame: () => void;
}

type ModalTab = 'main' | 'options' | 'load' | 'save' | 'settings';

const TAB_TITLES: Record<Exclude<ModalTab, 'main'>, string> = {
  options: 'Options',
  load: 'Load Game',
  save: 'Save Game',
  settings: 'Settings',
};

const MENU_ITEM_COUNT = 3;

export function StartMenuModal({ onStartGame }: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  // Index of the keyboard-selected menu item (null = nothing selected yet, so
  // the toffec corners only appear once the player actually uses the keyboard).
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    soundService.startMusic(SoundNames.startMenuMusic, 0.15);
    return () => {
      soundService.stopMusic(SoundNames.startMenuMusic);
    };
  }, []);

  // Reset the keyboard selection whenever we leave the main view.
  useEffect(() => {
    if (activeTab !== 'main') setSelectedIndex(null);
  }, [activeTab]);

  // Drop the keyboard selection as soon as the mouse moves, so the keyboard
  // selection corners never linger alongside a hovered button's corners.
  useEffect(() => {
    function clearKeyboardSelection() {
      setSelectedIndex((prev) => (prev === null ? prev : null));
    }
    window.addEventListener('pointermove', clearKeyboardSelection);
    return () => window.removeEventListener('pointermove', clearKeyboardSelection);
  }, []);

  const handleMenuClick = (callback: () => void, soundName: SoundNames = SoundNames.mechanicalClick) => {
    soundService.playSound(soundName, 0.4, 0.1);
    callback();
  };

  const handleStartGame = () => {
    soundService.stopMusic(SoundNames.startMenuMusic);
    handleMenuClick(onStartGame, SoundNames.shimmeringSuccessShort);
  };

  const handleOpenLoad = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('load');
  };

  const handleBackToMain = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('main');
  };

  const handleOpenSettings = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('settings');
  };

  // Arrow keys / WASD move the selection, Enter/Space activates it. The hook
  // always invokes the latest closure, so this reads current state directly.
  useWindowKeyDown((event) => {
    if (activeTab !== 'main') return;

    const direction = getNavDirection(event.key);
    if (direction === 'down') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev === null ? 0 : (prev + 1) % MENU_ITEM_COUNT));
    } else if (direction === 'up') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev === null ? MENU_ITEM_COUNT - 1 : (prev - 1 + MENU_ITEM_COUNT) % MENU_ITEM_COUNT));
    } else if (isConfirmKey(event.key)) {
      if (selectedIndex === null) return;
      event.preventDefault();
      [handleStartGame, handleOpenLoad, handleOpenSettings][selectedIndex]?.();
    }
  });

  const isModalOpen = activeTab !== 'main';

  return (
    <div className="main-menu">
      <div className="main-menu__bg" />
      <div className="main-menu__content">
        <div className="main-menu__title">
          <h1 className="main-menu__title-text">
            <NarikWoodBitFont text="Fantasy Puzzle RPG" size={3.5} />
          </h1>
        </div>

        <div className="main-menu__buttons">
          <ToffecBeigeCornersWrapper forceDisplay={selectedIndex === 0}>
            <button className="main-menu__button" onClick={handleStartGame}>
              <Play size={20} />
              Start Game
            </button>
          </ToffecBeigeCornersWrapper>
          <ToffecBeigeCornersWrapper forceDisplay={selectedIndex === 1}>
            <button className="main-menu__button" onClick={handleOpenLoad}>
              <FolderOpen size={20} />
              Load Game
            </button>
          </ToffecBeigeCornersWrapper>
        </div>
      </div>
      <ToffecBeigeCornersWrapper forceDisplay={selectedIndex === 2} className="main-menu__settings-corners">
        <button className="main-menu__settings-icon" onClick={handleOpenSettings} aria-label="Settings" />
      </ToffecBeigeCornersWrapper>

      {isModalOpen && (
        <div className="start-menu-modal-backdrop" onClick={handleBackToMain}>
          <div className="start-menu-modal-panel" onClick={(e) => e.stopPropagation()}>
            {/* Golden frame corner decorations */}
            <div className="start-menu-modal-corner start-menu-modal-corner--tl" />
            <div className="start-menu-modal-corner start-menu-modal-corner--tr" />
            <div className="start-menu-modal-corner start-menu-modal-corner--bl" />
            <div className="start-menu-modal-corner start-menu-modal-corner--br" />

            {/* Header bar */}
            <div className="start-menu-modal-header">
              <h2 className="start-menu-modal-title">
                <NarikWoodBitFont text={TAB_TITLES[activeTab as Exclude<ModalTab, 'main'>]} size={0.9} />
              </h2>
              <ToffecCloseButton variant="medieval1" hasBg size="sm" onClick={handleBackToMain} />
            </div>

            {/* Divider */}
            <div className="start-menu-modal-divider" />

            {/* Content */}
            <div className="start-menu-modal-body">
              {activeTab === 'options' && <PauseMenuOptions />}
              {activeTab === 'load' && <PauseMenuLoad />}
              {activeTab === 'save' && <PauseMenuSave />}
              {activeTab === 'settings' && <PauseMenuOptions />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
