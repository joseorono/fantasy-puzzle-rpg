import { NarikHeading } from '~/components/typography/narik-heading';

export function PauseMenuLoad() {
  return (
    <>
      <NarikHeading as="h2" text="Load" />
      <div className="pause-menu-placeholder">
        <div className="pause-menu-placeholder-icon">📂</div>
        <div className="pause-menu-placeholder-text">Load system coming soon</div>
      </div>
    </>
  );
}
