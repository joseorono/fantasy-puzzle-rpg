import { useEffect, useState } from 'react';
import type { Resources } from '~/types/resources';
import { filterNonZeroResources } from '~/lib/loot';
import { FLOOR_LOOT_NOTIFICATION_DISMISS_MS } from '~/constants/game';

interface FloorLootNotificationProps {
  resources: Resources;
  onClose: () => void;
  characterPosition: { x: number; y: number };
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
      className={`loot-notification pointer-events-none fixed z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={{
        left: `${characterPosition.x}px`,
        top: `${characterPosition.y - 60}px`,
        transform: 'translateX(-50%)',
        padding: '0.5rem 0.75rem',
        minWidth: '90px',
      }}
    >
      <p className="item-type mb-1 ml-0 text-center">Found</p>
      <div className="flex flex-wrap justify-center gap-x-2">
        {resourceEntries.map(([key, value]) => (
          <p key={key} className="loot-notification__item whitespace-nowrap">
            +{value} {key}
          </p>
        ))}
      </div>
    </div>
  );
}
