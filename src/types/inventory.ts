import type { Resources } from './resources';
import type { LineOrientation } from './battle';
import type { CharacterClass } from './rpg-elements';
import type { FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { ConsumableItemIds } from '~/constants/inventory';

export type ItemTypes = 'equipment' | 'consumable' | 'key';

export interface BaseItemData {
  id: string;
  name: string;
  type: ItemTypes;
  description: string;
  cost: Resources;
  iconName: Nullable<FrostyRpgIconName>;
}

export interface EquipmentItemData extends BaseItemData {
  pow: number;
  vit: number;
  spd: number;
  forClass?: CharacterClass;
  /**
   * Bonus added to the per-level cascade combo multiplier while this item is equipped.
   * Intentionally a very low percentual value (e.g. 0.02 = +2% per cascade level).
   * Absent = 0. See `getEquipmentComboBonus` and `calculateComboMultiplier`.
   */
  comboBonus?: number;
}

export type ConsumableAction =
  | { type: 'heal'; amount: number }
  /** Wipes one aimed row or column; every orb pays out like a match. See docs/LINE_CLEAR_ITEMS.md. */
  | { type: 'clear-line'; orientation: LineOrientation }
  | { type: 'fill-ultimate'; amount: number };

export interface ConsumableItemData extends BaseItemData {
  usableInBattle: boolean;
  usableOutOfBattle: boolean;
  action?: ConsumableAction;
  icon: string;
}

export type ConsumableItemIds = (typeof ConsumableItemIds)[number];
export type ItemStoreParams = Array<ConsumableItemIds>;

export type KeyItemData = BaseItemData;
