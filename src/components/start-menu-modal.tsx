import { useState } from 'react';
import { useAtom } from 'jotai';
import { activeMenuTabAtom } from '~/stores/pause-menu-atoms';
import { PauseMenuOptions } from './pause-menu/tabs/pause-menu-options';
import { PauseMenuLoad } from './pause-menu/tabs/pause-menu-load';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

interface StartMenuModalProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

type ModalTab = 'main' | 'options' | 'load';

export function StartMenuModal({ onStartGame, onLoadGame, onCredits, onQuit }: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [, setPauseMenuTab] = useAtom(activeMenuTabAtom);

  const handleMenuClick = (callback: () => void, soundName: SoundNames = SoundNames.mechanicalClick) => {
    soundService.playSound(soundName, 0.4, 0.1);
    callback();
  };

  const handleStartGame = () => {
    handleMenuClick(onStartGame, SoundNames.shimmeringSuccessShort);
  };

  const handleOpenOptions = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setPauseMenuTab('options');
    setActiveTab('options');
  };

  const handleOpenLoad = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setPauseMenuTab('load');
    setActiveTab('load');
  };

  const handleBackToMain = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('main');
  };

  return (
    <>
      {activeTab === 'main' && (
        <div className="main-menu">
          <div className="main-menu__bg" />
          <div className="main-menu__content">
            <div className="main-menu__title">
              <h1 className="main-menu__title-text">Fantasy Puzzle RPG</h1>
              <p className="main-menu__subtitle">Proudly Supporting transeconomic communities</p>
            </div>

            <div className="main-menu__buttons">
              <button className="main-menu__button" onClick={handleStartGame}>
                Start Game
              </button>
              <button className="main-menu__button" onClick={handleOpenLoad}>
                Load Game
              </button>
              <button className="main-menu__button" onClick={handleOpenOptions}>
                Options
              </button>
              <button className="main-menu__button" onClick={() => handleMenuClick(onQuit)}>
                Settings
              </button>
            </div>
          </div>
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
    </>
  );
}

