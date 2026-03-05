import { NarikHeading } from '~/components/typography/narik-heading';

export function PauseMenuSave() {
  return (
    <>
      <NarikHeading as="h2" text="Save" />
      <div className="pause-menu-placeholder">
        <div className="pause-menu-placeholder-icon">💾</div>
        <div className="pause-menu-placeholder-text">Save system coming soon</div>
      </div>
    </>
  );
}
