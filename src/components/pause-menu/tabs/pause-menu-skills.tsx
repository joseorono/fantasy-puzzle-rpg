import { PauseMenuTabHeader } from '~/components/pause-menu/pause-menu-tab-header';
import { SkillsPanel } from '~/components/skills/skills-panel';

interface PauseMenuSkillsProps {
  /** The content zone owns the keyboard — arrows/Enter act on this pane. */
  keyboardActive?: boolean;
  /** Fired when ← from the roster hands the keyboard back to the sidebar. */
  onExitToSidebar?: () => void;
}

/** The Skills tab: the shared `SkillsPanel` under the pause menu's tab header. */
export function PauseMenuSkills({ keyboardActive = false, onExitToSidebar }: PauseMenuSkillsProps) {
  return (
    <>
      <PauseMenuTabHeader text="Skills" hint="Unlock and upgrade each hero's skills." />
      <SkillsPanel keyboardActive={keyboardActive} onExitLeft={onExitToSidebar} />
    </>
  );
}
