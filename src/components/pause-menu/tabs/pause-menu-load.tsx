import { NarikHeading } from '~/components/typography/narik-heading';
import { SaveLoadMenu } from '~/components/save-load/save-load-menu';
import { usePauseMenu } from '~/hooks/use-pause-menu';

interface PauseMenuLoadProps {
  /** The hosting surface has handed the keyboard to this pane. */
  keyboardActive?: boolean;
  /** Fired when ← should hand the keyboard back to the pause sidebar. */
  onExitToSidebar?: () => void;
}

export function PauseMenuLoad({ keyboardActive, onExitToSidebar }: PauseMenuLoadProps) {
  const { close } = usePauseMenu();

  return (
    <>
      {/* Loading mid-run discards unsaved progress, so this host confirms first. */}
      <SaveLoadMenu
        mode="load"
        heading={<NarikHeading as="h2" text="Load" />}
        confirmLoad
        keyboardActive={keyboardActive}
        onExitToSidebar={onExitToSidebar}
        onLoaded={close}
      />
    </>
  );
}
