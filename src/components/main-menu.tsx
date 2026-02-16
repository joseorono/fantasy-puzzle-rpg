import { StartMenuModal } from './start-menu-modal';

interface MainMenuProps {
  onNewGame: () => void;
  onLoadGame: () => void;
  onCredits: () => void;
}

export function MainMenu({ onNewGame, onLoadGame, onCredits }: MainMenuProps) {
  return (
    <div className="game-view main-menu-view">
      <StartMenuModal onStartGame={onNewGame} onLoadGame={onLoadGame} onCredits={onCredits} />
    </div>
  );
}

