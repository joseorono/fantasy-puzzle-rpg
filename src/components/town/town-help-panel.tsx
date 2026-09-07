import { OverlayContainer } from '~/components/overlays/overlay-container';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { TOWN_HELP_ENTRIES } from '~/constants/town-help';

interface TownHelpPanelProps {
  onDismiss: () => void;
}

/**
 * Explains what each town location is for. Dismissal (backdrop click, Enter, Escape) is
 * `OverlayContainer`'s job; the hub gates its own key handlers while this is open so the
 * dismissing press can't also walk into a location behind it.
 */
export function TownHelpPanel({ onDismiss }: TownHelpPanelProps) {
  return (
    <OverlayContainer onDismiss={onDismiss}>
      <div className="town-help-panel">
        <h2 className="town-help-panel__title">
          <NarikWoodBitFont text="Around Town" size={1.2} />
        </h2>
        <ul className="town-help-panel__list">
          {TOWN_HELP_ENTRIES.map((entry) => (
            <li key={entry.location} className="town-help-entry">
              <span className="town-help-entry__icon">
                <FrostyRpgIcon name={entry.iconName} size={32} />
              </span>
              <span className="town-help-entry__body">
                <span className="town-help-entry__title pixel-font">{entry.title}</span>
                <span className="town-help-entry__description">{entry.description}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="town-help-panel__dismiss pixel-font">[ Enter or click to close ]</p>
      </div>
    </OverlayContainer>
  );
}
