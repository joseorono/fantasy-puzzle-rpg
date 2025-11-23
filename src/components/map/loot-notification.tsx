import { useEffect, useState } from 'react';
import { Package, Coins } from 'lucide-react';
import type { LootTable } from '~/types/loot';

interface LootNotificationProps {
  loot: LootTable;
  onClose: () => void;
}

/**
 * Non-blocking floating notification showing loot rewards
 * Appears at the top-right of the screen and auto-dismisses
 */
export function LootNotification({ loot, onClose }: LootNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const hasEquipment = loot.equipableItems.length > 0;
  const hasConsumables = loot.consumableItems.length > 0;
  const hasResources =
    loot.resources.item.coins > 0 ||
    loot.resources.item.gold > 0 ||
    loot.resources.item.copper > 0 ||
    loot.resources.item.silver > 0 ||
    loot.resources.item.bronze > 0;

  return (
    <div
      className={`fixed top-20 right-4 z-50 w-80 rounded-lg border-2 border-amber-800 bg-amber-50 p-4 shadow-2xl transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 border-b-2 border-amber-800 pb-2">
        <Package className="h-5 w-5 text-amber-900" />
        <h3 className="text-sm font-bold text-amber-900">Treasure Found!</h3>
      </div>

      {/* Loot contents */}
      <div className="space-y-2">
        {/* Equipment */}
        {hasEquipment && (
          <div className="rounded bg-white/60 p-2">
            <p className="mb-1 text-[10px] font-bold text-amber-900">Equipment:</p>
            <ul className="space-y-0.5">
              {loot.equipableItems.map((lootItem, idx) => (
                <li key={idx} className="text-[11px] text-gray-700">
                  • {lootItem.item.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Consumables */}
        {hasConsumables && (
          <div className="rounded bg-white/60 p-2">
            <p className="mb-1 text-[10px] font-bold text-amber-900">Items:</p>
            <ul className="space-y-0.5">
              {loot.consumableItems.map((lootItem, idx) => (
                <li key={idx} className="text-[11px] text-gray-700">
                  • {lootItem.item.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resources */}
        {hasResources && (
          <div className="rounded bg-white/60 p-2">
            <div className="flex items-center gap-1.5 text-amber-900">
              <Coins className="h-4 w-4" />
              <p className="text-[10px] font-bold">Resources:</p>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {loot.resources.item.coins > 0 && (
                <span className="text-[11px] text-gray-700">Coins: {loot.resources.item.coins}</span>
              )}
              {loot.resources.item.gold > 0 && (
                <span className="text-[11px] text-gray-700">Gold: {loot.resources.item.gold}</span>
              )}
              {loot.resources.item.copper > 0 && (
                <span className="text-[11px] text-gray-700">Copper: {loot.resources.item.copper}</span>
              )}
              {loot.resources.item.silver > 0 && (
                <span className="text-[11px] text-gray-700">Silver: {loot.resources.item.silver}</span>
              )}
              {loot.resources.item.bronze > 0 && (
                <span className="text-[11px] text-gray-700">Bronze: {loot.resources.item.bronze}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close hint */}
      <div className="mt-2 text-center">
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-[10px] text-amber-700 hover:text-amber-900"
        >
          Click to dismiss
        </button>
      </div>
    </div>
  );
}
