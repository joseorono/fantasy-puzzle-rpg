import { useEffect } from 'react';
import { StartMenuModal } from './start-menu-modal';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

export function MainMenu({ onNewGame, onLoadGame, onCredits, onQuit }: MainMenuProps) {
  useEffect(() => {
    soundService.startMusic(SoundNames.combatMusic, 0.5);
    return () => {
      soundService.stopMusic(SoundNames.combatMusic);
    };
  }, []);

  function handleStartGame() {
    soundService.stopMusic(SoundNames.combatMusic);
    onNewGame();
  }

  return (
    <div className="game-view main-menu-view">
      <StartMenuModal onStartGame={handleStartGame} onLoadGame={onLoadGame} onCredits={onCredits} onQuit={onQuit} />
    </div>
  );
}

