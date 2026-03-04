import { useEffect, useState } from 'react';
import type { LootTable } from '~/types/loot';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { LOOT_NOTIFICATION_DISMISS_MS } from '~/constants/game';

interface LootNotificationProps {
  loot: LootTable;
  onClose: () => void;
}

/**
 * Non-blocking floating notification showing loot rewards.
 * Appears at the top-right of the screen and auto-dismisses after LOOT_NOTIFICATION_DISMISS_MS.
 */
export function LootNotification({ loot, onClose }: LootNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss after configured duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, LOOT_NOTIFICATION_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [onClose]);

  function handleDismiss() {
    setIsVisible(false);
    setTimeout(onClose, 500);
  }

  const hasEquipment = loot.equipableItems.length > 0;
  const hasConsumables = loot.consumableItems.length > 0;
  const hasResources =
    loot.resources.item.coins > 0 ||
    loot.resources.item.gold > 0 ||
    loot.resources.item.copper > 0 ||
    loot.resources.item.silver > 0 ||
    loot.resources.item.iron > 0;

  return (
    <div
      className={`loot-notification absolute top-4 right-4 z-50 w-72 transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Header */}
      <div className="loot-notification__header">
        <NarikWoodBitFont text="Treasure Found" size={1.2} />
      </div>

      {/* Loot contents */}
      {hasEquipment && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Equipment</p>
          {loot.equipableItems.map((lootItem, idx) => (
            <p key={idx} className="loot-notification__item">
              {'\u2022'} {lootItem.item.name}
            </p>
          ))}
        </div>
      )}

      {hasConsumables && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Items</p>
          {loot.consumableItems.map((lootItem, idx) => (
            <p key={idx} className="loot-notification__item">
              {'\u2022'} {lootItem.item.name}
            </p>
          ))}
        </div>
      )}

      {hasResources && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Resources</p>
          <div className="loot-notification__resources-grid">
            {loot.resources.item.coins > 0 && (
              <span className="loot-notification__item">Coins: {loot.resources.item.coins}</span>
            )}
            {loot.resources.item.gold > 0 && (
              <span className="loot-notification__item">Gold: {loot.resources.item.gold}</span>
            )}
            {loot.resources.item.copper > 0 && (
              <span className="loot-notification__item">Copper: {loot.resources.item.copper}</span>
            )}
            {loot.resources.item.silver > 0 && (
              <span className="loot-notification__item">Silver: {loot.resources.item.silver}</span>
            )}
            {loot.resources.item.iron > 0 && (
              <span className="loot-notification__item">Iron: {loot.resources.item.iron}</span>
            )}
          </div>
        </div>
      )}

      {/* Dismiss */}
      <hr className="loot-notification__divider" />
      <button onClick={handleDismiss} className="loot-notification__dismiss">
        [ Click to dismiss ]
      </button>
    </div>
  );
}
