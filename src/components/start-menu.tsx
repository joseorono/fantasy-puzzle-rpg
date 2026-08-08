import { useRef, useState } from 'react';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
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
  useWindowKeyDown((event) => {
    if (isConfirmKey(event.key)) {
      event.preventDefault();
      handleStartClick();
    }
  }, !showMainMenu);

  // Load and Credits are handled inside the menu itself, so only New Game bubbles up.
  if (showMainMenu) {
    return <MainMenu onNewGame={onStartClick} />;
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

