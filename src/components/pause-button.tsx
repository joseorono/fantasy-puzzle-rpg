import { usePauseMenu } from '~/hooks/use-pause-menu';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Pause } from 'lucide-react';

export function PauseButton() {
  const { open } = usePauseMenu();

  function handleClick() {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    open();
  }

  return (
    <button
      className="pause-button"
      onClick={handleClick}
      title="Pause Menu (ESC)"
      aria-label="Open pause menu"
    >
      <Pause size={20} />
    </button>
  );
}
