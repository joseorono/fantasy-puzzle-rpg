import { useEffect, useState } from 'react';
import type { Resources } from '~/types/resources';
import type { Position } from '~/types/geometry';
import { filterNonZeroResources } from '~/lib/loot';
import { FLOOR_LOOT_NOTIFICATION_DISMISS_MS } from '~/constants/game';
import { RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';

interface FloorLootNotificationProps {
  resources: Resources;
  onClose: () => void;
  characterPosition: Position;
}

/**
 * Non-blocking floating notification showing collected floor loot resources.
 * Appears above the character and auto-dismisses after FLOOR_LOOT_NOTIFICATION_DISMISS_MS.
 * Only displays resources with non-zero values.
 */
export function FloorLootNotification({ resources, onClose, characterPosition }: FloorLootNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, FLOOR_LOOT_NOTIFICATION_DISMISS_MS);

    const closeTimer = setTimeout(() => {
      onClose();
    }, FLOOR_LOOT_NOTIFICATION_DISMISS_MS + 300);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(closeTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nonZeroResources = filterNonZeroResources(resources);
  const resourceEntries = Object.entries(nonZeroResources);

  if (resourceEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={`loot-notification floor-loot-notification pointer-events-none fixed z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={{
        left: `${characterPosition.x}px`,
        top: `${characterPosition.y - 60}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <p className="floor-loot-notification__title">Found!</p>
      <div className="floor-loot-notification__items">
        {resourceEntries.map(([key, value]) => {
          const resourceKey = key as keyof Resources;
          return (
            <div key={key} className="floor-loot-notification__item" title={RESOURCE_LABELS[resourceKey]}>
              <FrostyRpgIcon
                name={RESOURCE_ICON_NAMES[resourceKey]}
                size={24}
                className="floor-loot-notification__icon"
              />
              <span className="floor-loot-notification__amount">+{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
