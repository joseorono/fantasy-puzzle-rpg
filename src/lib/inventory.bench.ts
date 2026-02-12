import { bench, describe } from 'vitest';
import type { InventoryItem } from './inventory';
import {
  canAddItem,
  addItemToInventory,
  removeItemFromInventory,
  getItemQuantity,
  hasItem,
  getUniqueItemCount,
  getTotalItemCount,
  filterInventoryByType,
  sortInventoryByName,
  sortInventoryByQuantity,
} from './inventory';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { BaseItemData } from '~/types/inventory';

const smallInventory: InventoryItem[] = [
  { itemId: 'potion', quantity: 5 },
  { itemId: 'iron-sword', quantity: 1 },
  { itemId: 'bronze-armor', quantity: 2 },
];

const largeInventory: InventoryItem[] = [
  { itemId: 'potion', quantity: 50 },
  { itemId: 'high-potion', quantity: 20 },
  { itemId: 'iron-sword', quantity: 1 },
  { itemId: 'iron-daggers', quantity: 1 },
  { itemId: 'iron-staff', quantity: 1 },
  { itemId: 'iron-armor', quantity: 2 },
  { itemId: 'bronze-sword', quantity: 1 },
  { itemId: 'bronze-armor', quantity: 1 },
  { itemId: 'silver-sword', quantity: 1 },
  { itemId: 'golden-broadsword', quantity: 1 },
];

const allItems: BaseItemData[] = [...EquipmentItems, ...ConsumableItems];

describe('canAddItem', () => {
  bench('canAddItem', () => {
    canAddItem(10, 5);
  });
});

describe('addItemToInventory', () => {
  bench('add new item', () => {
    addItemToInventory(smallInventory, 'high-potion', 2);
  });

  bench('increase existing item', () => {
    addItemToInventory(smallInventory, 'potion', 3);
  });
});

describe('removeItemFromInventory', () => {
  bench('decrease quantity', () => {
    removeItemFromInventory(smallInventory, 'potion', 2);
  });

  bench('remove entirely', () => {
    removeItemFromInventory(smallInventory, 'iron-sword', 1);
  });
});

describe('getItemQuantity', () => {
  bench('existing item', () => {
    getItemQuantity(smallInventory, 'potion');
  });

  bench('non-existent item', () => {
    getItemQuantity(smallInventory, 'nonexistent');
  });
});

describe('hasItem', () => {
  bench('hasItem', () => {
    hasItem(smallInventory, 'potion', 3);
  });
});

describe('getUniqueItemCount', () => {
  bench('small inventory', () => {
    getUniqueItemCount(smallInventory);
  });

  bench('large inventory', () => {
    getUniqueItemCount(largeInventory);
  });
});

describe('getTotalItemCount', () => {
  bench('small inventory', () => {
    getTotalItemCount(smallInventory);
  });

  bench('large inventory', () => {
    getTotalItemCount(largeInventory);
  });
});

describe('filterInventoryByType', () => {
  bench('filter equipment', () => {
    filterInventoryByType(largeInventory, allItems, 'equipment');
  });

  bench('filter consumable', () => {
    filterInventoryByType(largeInventory, allItems, 'consumable');
  });
});

describe('sortInventoryByName', () => {
  bench('sort by name (10 items)', () => {
    sortInventoryByName(largeInventory, allItems);
  });
});

describe('sortInventoryByQuantity', () => {
  bench('sort by quantity (10 items)', () => {
    sortInventoryByQuantity(largeInventory);
  });
});
