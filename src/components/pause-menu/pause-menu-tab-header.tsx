import { NarikHeading } from '~/components/typography/narik-heading';

interface PauseMenuTabHeaderProps {
  text: string;
  /** One-line description of what the player can do in this pane. */
  hint: string;
}

/**
 * Standard pause-menu tab header: the Narik heading and a descriptive hint share
 * one bottom-aligned row — the same composition as SaveLoadMenu's header.
 */
export function PauseMenuTabHeader({ text, hint }: PauseMenuTabHeaderProps) {
  return (
    <div className="pause-menu-tab-header">
      <span className="pause-menu-tab-header__title">
        <NarikHeading as="h2" text={text} />
      </span>
      <p className="pause-menu-tab-header__hint pixel-font">{hint}</p>
    </div>
  );
}
