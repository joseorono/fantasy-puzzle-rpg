import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { activeMenuTabAtom } from '~/stores/pause-menu-atoms';
import { PauseMenuOptions } from './pause-menu/tabs/pause-menu-options';
import { PauseMenuLoad } from './pause-menu/tabs/pause-menu-load';
import { PauseMenuSave } from './pause-menu/tabs/pause-menu-save';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Play, FolderOpen, Settings, LogOut } from 'lucide-react';

interface StartMenuModalProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

type ModalTab = 'main' | 'options' | 'load' | 'save' | 'settings';

export function StartMenuModal({ onStartGame, onLoadGame, onCredits, onQuit }: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [, setPauseMenuTab] = useAtom(activeMenuTabAtom);

  useEffect(() => {
    soundService.startMusic(SoundNames.startMenuMusic, 0.2);
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

  const handleOpenOptions = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setPauseMenuTab('options');
    setActiveTab('options');
  };

  const handleOpenLoad = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('load');
  };

  const handleOpenSave = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('save');
  };

  const handleBackToMain = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('main');
  };

  const handleOpenSettings = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('settings');
  };

  return (
    <>
      {activeTab === 'main' && (
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
        </div>
      )}

      {activeTab === 'options' && (
        <div className="start-menu-modal-overlay">
          <div className="start-menu-modal-content">
            <button className="start-menu-modal-back" onClick={handleBackToMain}>
              ← Back
            </button>
            <div className="start-menu-modal-options">
              <PauseMenuOptions />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'load' && (
        <div className="start-menu-modal-overlay">
          <div className="start-menu-modal-content">
            <button className="start-menu-modal-back" onClick={handleBackToMain}>
              ← Back
            </button>
            <div className="start-menu-modal-load">
              <PauseMenuLoad />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'save' && (
        <div className="start-menu-modal-overlay">
          <div className="start-menu-modal-content">
            <button className="start-menu-modal-back" onClick={handleBackToMain}>
              ← Back
            </button>
            <div className="start-menu-modal-save">
              <PauseMenuSave />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="start-menu-modal-overlay">
          <div className="start-menu-modal-content">
            <button className="start-menu-modal-back" onClick={handleBackToMain}>
              ← Back
            </button>
            <div className="start-menu-modal-settings">
              <PauseMenuOptions />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

