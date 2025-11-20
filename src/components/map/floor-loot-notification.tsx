import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import type { Resources } from '~/types/resources';
import { filterNonZeroResources } from '~/lib/floor-loot';

interface FloorLootNotificationProps {
  resources: Resources;
  onClose: () => void;
  characterPosition: { x: number; y: number };
}

/**
 * Non-blocking floating notification showing collected floor loot resources
 * Appears above the character and auto-dismisses after 3 seconds
 * Only displays resources with non-zero values
 */
export function FloorLootNotification({ resources, onClose, characterPosition }: FloorLootNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let dismissTimer: NodeJS.Timeout;
    let closeTimer: NodeJS.Timeout;

    // Start visible, then auto-dismiss after 3 seconds
    dismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    // Wait for fade-out animation, then call onClose
    closeTimer = setTimeout(() => {
      onClose();
    }, 3300); // 3000ms visible + 300ms fade-out

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(closeTimer);
    };
  }, []); // Empty deps - only run once on mount

  // Filter to only show non-zero resources
  const nonZeroResources = filterNonZeroResources(resources);
  const resourceEntries = Object.entries(nonZeroResources);

  // Don't render if no resources to show
  if (resourceEntries.length === 0) {
    return null;
  }

  // Position above character
  const notificationStyle = {
    left: `${characterPosition.x}px`,
    top: `${characterPosition.y - 60}px`,
    transform: 'translateX(-50%)',
  };

  return (
    <div
      className={`pointer-events-none fixed z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={notificationStyle}
    >
      <div className="rounded-lg border-2 border-yellow-600 bg-yellow-50 px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-yellow-700" />
          <div className="flex flex-wrap gap-2">
            {resourceEntries.map(([key, value]) => (
              <span key={key} className="text-xs font-bold text-yellow-900">
                {key === 'coins' && `${value} coins`}
                {key === 'gold' && `${value} gold`}
                {key === 'copper' && `${value} copper`}
                {key === 'silver' && `${value} silver`}
                {key === 'bronze' && `${value} bronze`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
