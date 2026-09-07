import { NarikHeading } from '~/components/typography/narik-heading';
import { SaveLoadMenu } from '~/components/save-load/save-load-menu';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { getNavDirection } from '~/constants/keyboard';
import { useIsSaveLocked } from '~/hooks/use-save-game';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';

interface PauseMenuSaveProps {
  /** The hosting surface has handed the keyboard to this pane. */
  keyboardActive?: boolean;
  /** Fired when ← should hand the keyboard back to the pause sidebar. */
  onExitToSidebar?: () => void;
}

export function PauseMenuSave({ keyboardActive, onExitToSidebar }: PauseMenuSaveProps) {
  const isSaveLocked = useIsSaveLocked();

  // The locked notice has nothing to select, so ← is the only key it answers.
  useWindowKeyDown(
    (event) => {
      if (event.defaultPrevented) return;
      if (getNavDirection(event.key) !== 'left') return;
      event.preventDefault();
      onExitToSidebar?.();
    },
    Boolean(keyboardActive && isSaveLocked),
  );

  if (isSaveLocked) {
    return (
      <div className="save-load-menu">
        <div className="save-load-menu__header">
          <span className="save-load-menu__title">
            <NarikHeading as="h2" text="Save" />
          </span>
        </div>
        <div className="save-load-menu__locked pixel-font">
          <FrostyRpgIcon name="sealedScroll" size={40} className="save-load-menu__locked-icon" />
          <p className="save-load-menu__locked-title">Saving is not possible inside a dungeon.</p>
          <p className="save-load-menu__locked-text">Clear the dungeon or leave it to save your progress.</p>
        </div>
      </div>
    );
  }

  return (
    <SaveLoadMenu
      mode="save"
      heading={<NarikHeading as="h2" text="Save" />}
      keyboardActive={keyboardActive}
      onExitToSidebar={onExitToSidebar}
    />
  );
}
