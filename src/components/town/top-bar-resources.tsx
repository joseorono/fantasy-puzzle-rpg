import type { Resources } from '~/types/resources';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import { ResourceStatItem } from '~/components/ui-custom/resource-stat-item';

interface TopBarResourcesProps {
  resources: Resources;
}

export function TopBarResources({ resources }: TopBarResourcesProps) {
  return (
    <div className="top-bar-resources">
      {/* mr-14 is the only right inset beyond the wrapper's `right: 1rem`, and it sits
          inside the scaled element so it shrinks with the breakpoint transforms. */}
      <div className="top-bar-resources__container mr-14">
        {RESOURCE_DISPLAY_ORDER.map((key) => (
          <ResourceStatItem
            key={key}
            variant="town"
            riveted
            resource={key}
            label={RESOURCE_LABELS[key]}
            value={resources[key]}
            iconName={RESOURCE_ICON_NAMES[key]}
          />
        ))}
      </div>
    </div>
  );
}
