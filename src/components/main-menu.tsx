import { StartMenuModal } from './start-menu-modal';

interface MainMenuProps {
  onNewGame: () => void;
}

export function MainMenu({ onNewGame }: MainMenuProps) {
  return (
    <div className="game-view main-menu-view">
      <StartMenuModal onStartGame={onNewGame} />
    </div>
  );
}

