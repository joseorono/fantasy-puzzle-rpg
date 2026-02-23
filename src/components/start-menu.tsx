import { useState } from 'react';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { MainMenu } from './main-menu';

interface StartMenuProps {
  onStartClick: () => void;
}

export function StartMenu({ onStartClick }: StartMenuProps) {
  const [showMainMenu, setShowMainMenu] = useState(false);

  const handleStartClick = () => {
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    setShowMainMenu(true);
  };

  const handleNewGame = () => {
    onStartClick();
  };

  const handleLoadGame = () => {
    console.log('Load Game clicked');
  };

  const handleCredits = () => {
    console.log('Credits clicked');
  };

  if (showMainMenu) {
    return <MainMenu onNewGame={handleNewGame} onLoadGame={handleLoadGame} onCredits={handleCredits} />;
  }

  return (
    <div className="start-menu">
      <div className="start-menu__bg" />

      <div className="start-menu__loading-section">
        <button onClick={handleStartClick} className="start-menu__button">
          START
        </button>
      </div>
    </div>
  );
}

