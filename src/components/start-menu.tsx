import { useEffect, useRef, useState } from 'react';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { MainMenu } from './main-menu';

interface StartMenuProps {
  onStartClick: () => void;
}

export function StartMenu({ onStartClick }: StartMenuProps) {
  const [showMainMenu, setShowMainMenu] = useState(false);
  const hasStartedRef = useRef(false);

  // Guarded so the button click, Enter/Space keydown, and focus activation
  // can never trigger the start sound/transition more than once.
  const handleStartClick = () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    setShowMainMenu(true);
  };

  // Press Enter or Space anywhere on the title screen to start.
  useEffect(() => {
    if (showMainMenu) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        handleStartClick();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMainMenu]);

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
      <div className="start-menu__overlay" />
      <div className="start-menu__cover" />

      <div className="start-menu__loading-section">
        <button onClick={handleStartClick} className="start-menu__button" autoFocus>
          Press Start
        </button>
      </div>
    </div>
  );
}

