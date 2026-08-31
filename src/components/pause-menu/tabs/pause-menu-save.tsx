import { NarikHeading } from '~/components/typography/narik-heading';
import { SaveLoadMenu } from '~/components/save-load/save-load-menu';

interface PauseMenuSaveProps {
  /** The hosting surface has handed the keyboard to this pane. */
  keyboardActive?: boolean;
  /** Fired when ← should hand the keyboard back to the pause sidebar. */
  onExitToSidebar?: () => void;
}

export function PauseMenuSave({ keyboardActive, onExitToSidebar }: PauseMenuSaveProps) {
  return (
    <>
      <SaveLoadMenu
        mode="save"
        heading={<NarikHeading as="h2" text="Save" />}
        keyboardActive={keyboardActive}
        onExitToSidebar={onExitToSidebar}
      />
    </>
  );
}
