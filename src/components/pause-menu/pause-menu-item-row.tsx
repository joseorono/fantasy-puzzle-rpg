import NumberFlow from '@number-flow/react';
import { cn } from '~/lib/utils';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import type { InventoryItem } from '~/lib/inventory';
import type { BaseItemData } from '~/types/inventory';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

interface PauseMenuItemRowProps {
  item: BaseItemData;
  stack: InventoryItem;
  /** Party members wearing this exact stack (equipment only). */
  equippedCount: number;
  /** The stack the item card is showing. */
  isSelected: boolean;
  /** The keyboard cursor rests on this row. */
  isKeyboardCursor: boolean;
  onSelect: () => void;
  /** Registers the row for scroll-into-view. */
  rowRef: (el: HTMLDivElement | null) => void;
}

/** One inventory stack in the Items list: framed icon, name (+ rarity for gear), equipped pill, quantity. */
export function PauseMenuItemRow({
  item,
  stack,
  equippedCount,
  isSelected,
  isKeyboardCursor,
  onSelect,
  rowRef,
}: PauseMenuItemRowProps) {
  const isEquipment = item.type === 'equipment';

  return (
    <div
      ref={rowRef}
      className={cn('pause-menu-item-row', isSelected && 'selected', isKeyboardCursor && 'kb-cursor')}
      onClick={onSelect}
    >
      <span className="pause-menu-item-row__icon">
        <ItemIcon item={item} size={24} />
      </span>
      <span className="pause-menu-item-row__text">
        <span
          className="pause-menu-item-row__name"
          style={isEquipment ? { color: getRarityColor(stack.rarity) } : undefined}
        >
          {item.name}
        </span>
        {isEquipment && (
          <span className="pause-menu-item-row__rarity" style={{ color: getRarityColor(stack.rarity) }}>
            {getRarityLabel(stack.rarity)}
          </span>
        )}
      </span>
      <span className="pause-menu-item-row__meta">
        {equippedCount > 0 && (
          <span className="pause-menu-item-row__equipped">
            {equippedCount > 1 ? `Equipped ×${equippedCount}` : 'Equipped'}
          </span>
        )}
        <span className="pause-menu-item-row__qty number-flow-container">
          ×
          <NumberFlow
            value={stack.quantity}
            format={INTEGER_FORMAT}
            trend={-1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
        </span>
      </span>
    </div>
  );
}
