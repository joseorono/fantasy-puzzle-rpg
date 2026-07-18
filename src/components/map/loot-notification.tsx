import { useEffect, useState } from 'react';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { ResourceChip } from '~/components/ui-custom/resource-chip';
import { RESOURCE_DISPLAY_ORDER } from '~/constants/resources';
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
  const earnedResources = RESOURCE_DISPLAY_ORDER.map((key) => ({
    key,
    amount: loot.resources.item[key],
  })).filter((entry) => entry.amount > 0);

  return (
    <div
      className={`loot-notification absolute top-4 right-4 z-50 w-72 transition-all duration-500 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Header */}
      <div className="loot-notification__header">
        <NarikWoodBitFont text="Treasure Found" size={1.1} />
      </div>

      {/* Equipment */}
      {hasEquipment && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Equipment</p>
          {loot.equipableItems.map((lootItem, idx) => (
            <div key={idx} className="loot-notification__entry">
              <span className="loot-notification__entry-icon">
                {lootItem.item.iconName ? <FrostyRpgIcon name={lootItem.item.iconName} size={24} /> : null}
              </span>
              <span className="loot-notification__entry-name" style={{ color: getRarityColor(lootItem.rarity) }}>
                {lootItem.item.name}
                <span className="ml-1 text-[0.55rem] tracking-wider uppercase opacity-80">
                  {getRarityLabel(lootItem.rarity)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Consumables */}
      {hasConsumables && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Items</p>
          {loot.consumableItems.map((lootItem, idx) => (
            <div key={idx} className="loot-notification__entry">
              <span className="loot-notification__entry-icon">
                {lootItem.item.iconName ? <FrostyRpgIcon name={lootItem.item.iconName} size={24} /> : null}
              </span>
              <span className="loot-notification__entry-name">{lootItem.item.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resources */}
      {earnedResources.length > 0 && (
        <div className="loot-notification__section">
          <p className="loot-notification__section-label">Resources</p>
          <div className="loot-notification__resources">
            {earnedResources.map(({ key, amount }) => (
              <ResourceChip key={key} resource={key as keyof Resources} amount={amount} iconSize={20} />
            ))}
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
