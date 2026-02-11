import { StartMenuModal } from './start-menu-modal';

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

export function MainMenu({ onNewGame, onLoadGame, onCredits, onQuit }: MainMenuProps) {
  return (
    <div className="game-view main-menu-view">
      <StartMenuModal onStartGame={onNewGame} onLoadGame={onLoadGame} onCredits={onCredits} onQuit={onQuit} />
    </div>
  );
}

