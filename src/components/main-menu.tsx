import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

export function MainMenu({ onNewGame, onLoadGame, onCredits, onQuit }: MainMenuProps) {
  const handleMenuClick = (callback: () => void, soundName: SoundNames = SoundNames.mechanicalClick) => {
    soundService.playSound(soundName, 0.4, 0.1);
    callback();
  };

  return (
    <div className="game-view main-menu-view">
      <div className="main-menu">
        <div className="main-menu__bg" />

        <div className="main-menu__content">
          <div className="main-menu__title">
            <h1 className="main-menu__title-text">Fantasy Puzzle RPG</h1>
            <p className="main-menu__subtitle">Supporting transeconomic communities</p>
          </div>

          <div className="main-menu__buttons">
            <button className="main-menu__button" onClick={() => handleMenuClick(onNewGame)}>
              Start Game
            </button>
            <button className="main-menu__button" onClick={() => handleMenuClick(onLoadGame)}>
              Load Game
            </button>
            <button className="main-menu__button" onClick={() => handleMenuClick(onCredits)}>
              Save Game
            </button>
            <button className="main-menu__button" onClick={() => handleMenuClick(onQuit)}>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

