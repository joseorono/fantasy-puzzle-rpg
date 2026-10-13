/**
 * One place that decides how an item is drawn, so the battle bar, shop, pause menu, loot popups
 * and rewards screen all agree. Resolution order: a hand-drawn override for the item id, then its
 * Frosty sheet sprite, then a consumable's emoji, then nothing.
 */

import type { ComponentType } from 'react';
import type { BaseItemData } from '~/types/inventory';
import { FrostyRpgIcon } from './frost-icons';
import { ColumnClearIcon, RowClearIcon, type LineClearIconProps } from './line-clear-icons';

/** Items with no sheet sprite that are drawn by a component of their own. */
const ITEM_ICON_OVERRIDES: Record<string, ComponentType<LineClearIconProps>> = {
  'row-clear': RowClearIcon,
  'column-clear': ColumnClearIcon,
};

export interface ItemIconProps {
  item: BaseItemData;
  /** Rendered size in pixels (default 24). */
  size?: number;
  className?: string;
}

export function ItemIcon({ item, size = 24, className }: ItemIconProps) {
  const Override = ITEM_ICON_OVERRIDES[item.id];
  if (Override) return <Override size={size} className={className} />;

  if (item.iconName) return <FrostyRpgIcon name={item.iconName} size={size} className={className} />;

  if ('icon' in item && typeof item.icon === 'string') {
    return (
      <span className={className} style={{ fontSize: size * 0.75, lineHeight: 1 }} aria-hidden="true">
        {item.icon}
      </span>
    );
  }

  return null;
}
