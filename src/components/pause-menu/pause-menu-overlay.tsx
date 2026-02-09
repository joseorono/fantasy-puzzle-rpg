import { usePauseMenu } from '~/hooks/use-pause-menu';
import { PauseMenu } from './pause-menu';

export function PauseMenuOverlay() {
  const { isOpen, close } = usePauseMenu();

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  return (
    <div className="pause-menu-backdrop" onClick={handleBackdropClick}>
      <PauseMenu />
    </div>
  );
}
