/*
 * Inventory and items constants
 */

import type { ConsumableItemData, EquipmentItemData } from "~/types";

export const MAX_AMOUNT_PER_ITEM = 99;

/*
 * Items
 */
export const EquipmentItems: EquipmentItemData[] = [
  // --- Iron Tier ---
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: 'equipment',
    description: 'A trusty, if a bit dull, sword.',
    pow: 5,
    vit: 2,
    spd: 0,
    forClass: 'warrior',
  },
  {
    id: 'iron-daggers',
    name: 'Iron Daggers',
    type: 'equipment',
    description: 'For quick and pointy-stabby action.',
    pow: 3,
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
    vit: 1,
    spd: 1,
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

  // --- Bronze Tier ---
  {
    id: 'bronze-sword',
    name: 'Bronze Sword',
    type: 'equipment',
    description: 'Better than iron, with a nice sheen.',
    pow: 8,
    vit: 3,
    spd: 0,
    forClass: 'warrior',
  },
  {
    id: 'bronze-daggers',
    name: 'Bronze Daggers',
    type: 'equipment',
    description: 'Slightly faster, slightly stronger.',
    pow: 5,
    vit: 1,
    spd: 5,
    forClass: 'rogue',
  },
  {
    id: 'bronze-staff',
    name: 'Bronze Staff',
    type: 'equipment',
    description: 'A bronze-capped staff that hums with a little power.',
    pow: 7,
    vit: 2,
    spd: 2,
    forClass: 'mage',
  },
  {
    id: 'bronze-armor',
    name: 'Bronze Armor',
    type: 'equipment',
    description: 'Still heavy, but offers more protection than iron.',
    pow: 0,
    vit: 15,
    spd: -3,
  },

  // --- Silver Tier ---
  {
    id: 'silver-sword',
    name: 'Silver Sword',
    type: 'equipment',
    description: 'Lightweight and deadly. Especially against things that hate silver.',
    pow: 12,
    vit: 0,
    spd: 4,
    forClass: 'warrior',
  },
  {
    id: 'silver-daggers',
    name: 'Silver Daggers',
    type: 'equipment',
    description: 'A blur of silver in the dark.',
    pow: 8,
    vit: 0,
    spd: 8,
    forClass: 'rogue',
  },
  {
    id: 'silver-staff',
    name: 'Silver Staff',
    type: 'equipment',
    description: 'Conducts magic with impressive efficiency.',
    pow: 11,
    vit: 2,
    spd: 5,
    forClass: 'mage',
  },
  {
    id: 'silver-armor',
    name: 'Silver Armor',
    type: 'equipment',
    description: 'Surprisingly tough for such a light metal.',
    pow: 0,
    vit: 22,
    spd: -1,
  },

  // --- Steel Tier ---
  {
    id: 'steel-sword',
    name: 'Steel Sword',
    type: 'equipment',
    description: "The blacksmith's pride. Solid, reliable, and sharp.",
    pow: 16,
    vit: 4,
    spd: 1,
    forClass: 'warrior',
  },
  {
    id: 'steel-daggers',
    name: 'Steel Daggers',
    type: 'equipment',
    description: 'Perfectly balanced for swift, silent strikes.',
    pow: 10,
    vit: 1,
    spd: 10,
    forClass: 'rogue',
  },
  {
    id: 'steel-staff',
    name: 'Steel Staff',
    type: 'equipment',
    description: 'Reinforced with steel. Surprisingly good for channeling magic.',
    pow: 15,
    vit: 2,
    spd: 4,
    forClass: 'mage',
  },
  {
    id: 'steel-armor',
    name: 'Steel Armor',
    type: 'equipment',
    description: 'A solid upgrade. Much lighter than it looks.',
    pow: 0,
    vit: 30,
    spd: 0,
  },

  // --- Gold Tier ---
  {
    id: 'golden-broadsword',
    name: 'Golden Broadsword',
    type: 'equipment',
    description: 'A blade of pure, enchanted gold. Heavy, but hits like a truck.',
    pow: 22,
    vit: 6,
    spd: -4,
    forClass: 'warrior',
  },
  {
    id: 'golden-dirks',
    name: 'Golden Dirks',
    type: 'equipment',
    description: 'Ornate, sharp, and magically quick.',
    pow: 14,
    vit: 2,
    spd: 12,
    forClass: 'rogue',
  },
  {
    id: 'golden-scepter',
    name: 'Golden Scepter',
    type: 'equipment',
    description: 'A symbol of magical authority that crackles with power.',
    pow: 20,
    vit: 5,
    spd: 6,
    forClass: 'mage',
  },
  {
    id: 'golden-plate-armor',
    name: 'Golden Plate Armor',
    type: 'equipment',
    description: 'So heavy, but so protective. And so, so shiny.',
    pow: 0,
    vit: 40,
    spd: -5,
  },

  // --- Legendary & Joke Tier ---
  {
    id: 'gilded-steel-armor',
    name: 'Gilded Steel Armor',
    type: 'equipment',
    description: 'Masterwork steel armor with gold filigree. Peak protection.',
    pow: 5,
    vit: 45,
    spd: 0,
  },
  {
    id: 'gold-armor',
    name: 'Gold Armor',
    type: 'equipment',
    description: "Impressively shiny and incredibly soft. What, you thought it'd be good?",
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
