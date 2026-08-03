import { useEffect, useRef, useState } from 'react';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { ResourceChip } from '~/components/ui-custom/resource-chip';
import { RESOURCE_DISPLAY_ORDER } from '~/constants/resources';
import {
  LOOT_NOTIFICATION_DISMISS_MS,
  LOOT_NOTIFICATION_FADE_MS,
  LOOT_NOTIFICATION_FADE_IN_DELAY_MS,
} from '~/constants/game';
import { KeyboardKeys } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';

interface LootNotificationProps {
  loot: LootTable;
  onClose: () => void;
}

/**
 * Non-blocking floating notification showing loot rewards.
 * Appears at the top-right of the screen and auto-dismisses after LOOT_NOTIFICATION_DISMISS_MS,
 * or early on Backspace / a click on its dismiss line.
 */
export function LootNotification({ loot, onClose }: LootNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Held in a ref so the timers below can be armed once on mount. Both call sites pass a fresh
  // inline arrow for onClose, and a `[onClose]` dependency would re-arm the auto-dismiss on every
  // parent render — which, on the map, is every tile the player walks.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasDismissedRef = useRef(false);

  function startFadeOut() {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;
    setIsVisible(false);
    timersRef.current.push(setTimeout(() => onCloseRef.current(), LOOT_NOTIFICATION_FADE_MS));
  }

  useEffect(() => {
    const timers = timersRef.current;
    timers.push(setTimeout(() => setIsVisible(true), LOOT_NOTIFICATION_FADE_IN_DELAY_MS));
    timers.push(setTimeout(startFadeOut, LOOT_NOTIFICATION_DISMISS_MS));
    // Every timer is tracked, so an early unmount can't leave one to call onClose afterwards.
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, []);

  // Backspace rather than the confirm key: this toast is non-blocking and already auto-dismisses,
  // so it must not swallow the Enter the map and dungeon bind for themselves, nor be wiped out by
  // an Enter meant for them. Backspace is claimed nowhere else, so it needs no priority handling.
  useWindowKeyDown((event) => {
    if (event.key !== KeyboardKeys.Backspace) return;
    event.preventDefault();
    startFadeOut();
  }, isVisible);

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
      <button onClick={startFadeOut} className="loot-notification__dismiss">
        [ Backspace or click to dismiss ]
      </button>
    </div>
  );
}
