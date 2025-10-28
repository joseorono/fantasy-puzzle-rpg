/*
 * Inventory and items constants
 */

import type { ConsumableItemData, EquipmentItemData } from "~/types";

export const MAX_AMOUNT_PER_ITEM = 99;

/*
 * Items
 */
export const EquipmentItems: EquipmentItemData[] = [

];

export const ConsumableItems: ConsumableItemData[] = [
  {
    id: 'potion',
    name: 'Potion',
    type: 'consumable',
    description: 'Heals a little. Tastes like red.',
    amount: 100,
  },
  {
    id: 'high-potion',
    name: 'High Potion',
    type: 'consumable',
    description: 'Heals a lot. Tastes like really red.',
    amount: 500,
  },
  {
    id: 'energy-booster',
    name: 'Energy Booster',
    type: 'consumable',
    description: 'A jolt for the whole team. Fills 30% of the ultimate bar.',
    amount: 30,
  },
];
