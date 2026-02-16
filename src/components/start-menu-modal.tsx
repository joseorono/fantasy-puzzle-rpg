import { useState, useEffect } from 'react';
import { PauseMenuOptions } from './pause-menu/tabs/pause-menu-options';
import { PauseMenuLoad } from './pause-menu/tabs/pause-menu-load';
import { PauseMenuSave } from './pause-menu/tabs/pause-menu-save';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Play, FolderOpen, LogOut, ArrowLeft } from 'lucide-react';

interface StartMenuModalProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

type ModalTab = 'main' | 'options' | 'load' | 'save' | 'settings';

const TAB_TITLES: Record<Exclude<ModalTab, 'main'>, string> = {
  options: 'Options',
  load: 'Load Game',
  save: 'Save Game',
  settings: 'Settings',
};

export function StartMenuModal({ onStartGame, onLoadGame, onCredits, onQuit }: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('main');

  useEffect(() => {
    soundService.startMusic(SoundNames.startMenuMusic, 0.15);
    return () => {
      soundService.stopMusic(SoundNames.startMenuMusic);
    };
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

  const isModalOpen = activeTab !== 'main';

  return (
    <div className="main-menu">
      <div className="main-menu__bg" />
      <div className="main-menu__content">
        <div className="main-menu__title">
          <h1 className="main-menu__title-text">Fantasy Puzzle RPG</h1>
        </div>

        <div className="main-menu__buttons">
          <button className="main-menu__button" onClick={handleStartGame}>
            <Play size={20} />
            Start Game
          </button>
          <button className="main-menu__button" onClick={handleOpenLoad}>
            <FolderOpen size={20} />
            Load Game
          </button>
          <button className="main-menu__button" onClick={() => handleMenuClick(onQuit)}>
            <LogOut size={20} />
            Quit
          </button>
        </div>
      </div>
      <button className="main-menu__settings-icon" onClick={handleOpenSettings} />

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
              <button className="start-menu-modal-back" onClick={handleBackToMain}>
                <ArrowLeft size={14} />
                Back
              </button>
              <h2 className="start-menu-modal-title">{TAB_TITLES[activeTab as Exclude<ModalTab, 'main'>]}</h2>
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
