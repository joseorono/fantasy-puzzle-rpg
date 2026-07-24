import { useResources } from '~/stores/game-store';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import { PauseMenuResourceItem } from '~/components/pause-menu/pause-menu-resource-item';

export function PauseMenuResourcesBar() {
  const resources = useResources();

  return (
    <div className="pause-menu-resources-bar">
      {RESOURCE_DISPLAY_ORDER.map((key) => (
        <PauseMenuResourceItem
          key={key}
          resourceKey={key}
          label={RESOURCE_LABELS[key]}
          value={resources[key]}
          iconName={RESOURCE_ICON_NAMES[key]}
        />
      ))}
    </div>
  );
}
