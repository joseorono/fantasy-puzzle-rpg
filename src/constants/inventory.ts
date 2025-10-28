/*
 * Inventory and items constants
 */

import type { ConsumableItemData, EquipmentItemData } from "~/types";

export const MAX_AMOUNT_PER_ITEM = 99;

/*
 * Items
 */
export const EquipmentItems: EquipmentItemData[] = [
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: 'equipment',
    description: 'A trusty, if a bit dull, sword.',
    pow: 5,
    vit: 0,
    spd: 0,
    forClass: 'warrior',
  },
  {
    id: 'iron-daggers',
    name: 'Iron Daggers',
    type: 'equipment',
    description: 'For quick and pointy-stabby action.',
    pow: 2,
    vit: 0,
    spd: 3,
    forClass: 'rogue',
  },
  {
    id: 'iron-staff',
    name: 'Iron Staff',
    type: 'equipment',
    description: 'A heavy stick for hitting things and occasionally casting spells.',
    pow: 4,
    vit: 0,
    spd: 0,
    forClass: 'mage',
  },
  {
    id: 'iron-armor',
    name: 'Iron Armor',
    type: 'equipment',
    description: 'Heavy, clunky, but it gets the job done.',
    pow: 0,
    vit: 10,
    spd: -2,
  },
  {
    id: 'gold-armor',
    name: 'Gold Armor',
    type: 'equipment',
    description: 'Impressively shiny and incredibly soft. What, you thought it\'d be good?',
    pow: 0,
    vit: 1,
    spd: -5,
  },
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
