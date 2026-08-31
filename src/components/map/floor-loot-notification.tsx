import { useEffect, useState } from 'react';
import type { Resources } from '~/types/resources';
import type { Position } from '~/types/geometry';
import { filterNonZeroResources } from '~/lib/loot';
import { FLOOR_LOOT_NOTIFICATION_DISMISS_MS } from '~/constants/game';
import { ResourceChip } from '~/components/ui-custom/resource-chip';

interface FloorLootNotificationProps {
  resources: Resources;
  onClose: () => void;
  characterPosition: Position;
  tileSize?: number;
  displayScale?: number;
}

/**
 * Non-blocking floating notification showing collected floor loot resources.
 * Appears above the character and auto-dismisses after FLOOR_LOOT_NOTIFICATION_DISMISS_MS.
 * Only displays resources with non-zero values.
 */
export function FloorLootNotification({
  resources,
  onClose,
  characterPosition,
}: FloorLootNotificationProps) {
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

  // Side-positioned floating popup outside the character (matching NodeInteractionMenu style & behavior)
  const notificationWidth = 220;
  const offset = 45;

  const tooltipLeft = characterPosition.x + offset;
  const shouldFlipLeft =
    typeof window !== 'undefined' && tooltipLeft + notificationWidth > window.innerWidth - 20;

  const finalLeft = shouldFlipLeft
    ? Math.max(10, characterPosition.x - notificationWidth - offset)
    : Math.min(
        tooltipLeft,
        typeof window !== 'undefined' ? window.innerWidth - notificationWidth - 10 : tooltipLeft
      );

  const finalTop =
    typeof window !== 'undefined'
      ? Math.max(20, Math.min(characterPosition.y - 50, window.innerHeight - 120))
      : characterPosition.y - 50;

  return (
    <div
      className={`loot-notification floor-loot-notification pointer-events-none fixed z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={{
        left: `${finalLeft}px`,
        top: `${finalTop}px`,
        width: `${notificationWidth}px`,
      }}
    >
      {/* Arrow pointer matching NodeInteractionMenu */}
      <div
        className={`nim-arrow ${shouldFlipLeft ? 'nim-arrow--right' : 'nim-arrow--left'}`}
        style={{
          [shouldFlipLeft ? 'right' : 'left']: '-16px',
          top: '16px',
        }}
      />
      <p className="floor-loot-notification__title">Found!</p>
      <div className="floor-loot-notification__items">
        {resourceEntries.map(([key, value]) => (
          <ResourceChip key={key} resource={key as keyof Resources} amount={value ?? 0} />
        ))}
      </div>
    </div>
  );
}
