import { describe, it, expect } from 'vitest';
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
  sortInventoryForDisplay,
  describeConsumableAction,
  getConsumableUsability,
} from './inventory';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';
import type { BaseItemData } from '~/types/inventory';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';

const emptyInventory: InventoryItem[] = [];

const testInventory: InventoryItem[] = [
  { itemId: 'potion', quantity: 5 },
  { itemId: 'iron-sword', quantity: 1 },
  { itemId: 'bronze-armor', quantity: 2 },
];

describe('inventory utilities', () => {
  describe('canAddItem', () => {
    it('should return true when item can be added', () => {
      expect(canAddItem(10, 5)).toBe(true);
    });

    it('should return false when adding would exceed max', () => {
      expect(canAddItem(95, 10)).toBe(false);
    });

    it('should return true when adding exactly reaches max', () => {
      expect(canAddItem(90, 9)).toBe(true);
    });

    it('should handle zero quantity', () => {
      expect(canAddItem(50, 0)).toBe(true);
    });
  });

  describe('addItemToInventory', () => {
    it('should add new item to empty inventory', () => {
      const result = addItemToInventory(emptyInventory, 'potion', 3);
      expect(result).toEqual([{ itemId: 'potion', quantity: 3 }]);
    });

    it('should add new item to existing inventory', () => {
      const result = addItemToInventory(testInventory, 'high-potion', 2);
      expect(result).toHaveLength(4);
      expect(result[3]).toEqual({ itemId: 'high-potion', quantity: 2 });
    });

    it('should increase quantity of existing item', () => {
      const result = addItemToInventory(testInventory, 'potion', 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ itemId: 'potion', quantity: 8 });
    });

    it('should cap quantity at MAX_AMOUNT_PER_ITEM', () => {
      const inventory: InventoryItem[] = [{ itemId: 'potion', quantity: 95 }];
      const result = addItemToInventory(inventory, 'potion', 10);
      expect(result[0].quantity).toBe(MAX_AMOUNT_PER_ITEM);
    });

    it('should default to quantity 1 when not specified', () => {
      const result = addItemToInventory(emptyInventory, 'potion');
      expect(result[0].quantity).toBe(1);
    });

    it('should not mutate original inventory', () => {
      const original = [...testInventory];
      addItemToInventory(testInventory, 'potion', 5);
      expect(testInventory).toEqual(original);
    });
  });

  describe('rarity-keyed stacking', () => {
    it('keeps different rarities of the same item as separate stacks', () => {
      let inv = addItemToInventory(emptyInventory, 'iron-sword', 1, 'common');
      inv = addItemToInventory(inv, 'iron-sword', 1, 'rare');
      expect(inv).toHaveLength(2);
      expect(getItemQuantity(inv, 'iron-sword', 'common')).toBe(1);
      expect(getItemQuantity(inv, 'iron-sword', 'rare')).toBe(1);
    });

    it('stacks items of the same id and rarity', () => {
      let inv = addItemToInventory(emptyInventory, 'iron-sword', 1, 'rare');
      inv = addItemToInventory(inv, 'iron-sword', 2, 'rare');
      expect(inv).toHaveLength(1);
      expect(inv[0]).toEqual({ itemId: 'iron-sword', quantity: 3, rarity: 'rare' });
    });

    it('sums all rarities when no rarity is given to getItemQuantity', () => {
      let inv = addItemToInventory(emptyInventory, 'iron-sword', 1, 'common');
      inv = addItemToInventory(inv, 'iron-sword', 2, 'rare');
      expect(getItemQuantity(inv, 'iron-sword')).toBe(3);
    });

    it('removes from the matching rarity stack only', () => {
      let inv = addItemToInventory(emptyInventory, 'iron-sword', 1, 'common');
      inv = addItemToInventory(inv, 'iron-sword', 1, 'rare');
      inv = removeItemFromInventory(inv, 'iron-sword', 1, 'common');
      expect(getItemQuantity(inv, 'iron-sword', 'common')).toBe(0);
      expect(getItemQuantity(inv, 'iron-sword', 'rare')).toBe(1);
    });

    it('does not add a rarity key for consumables', () => {
      const inv = addItemToInventory(emptyInventory, 'potion', 2);
      expect(inv[0]).toEqual({ itemId: 'potion', quantity: 2 });
      expect('rarity' in inv[0]).toBe(false);
    });
  });

  describe('removeItemFromInventory', () => {
    it('should decrease quantity of existing item', () => {
      const result = removeItemFromInventory(testInventory, 'potion', 2);
      expect(result[0]).toEqual({ itemId: 'potion', quantity: 3 });
    });

    it('should remove item when quantity reaches zero', () => {
      const result = removeItemFromInventory(testInventory, 'iron-sword', 1);
      expect(result).toHaveLength(2);
      expect(result.find((item) => item.itemId === 'iron-sword')).toBeUndefined();
    });

    it('should remove item when removing more than available', () => {
      const result = removeItemFromInventory(testInventory, 'potion', 10);
      expect(result).toHaveLength(2);
      expect(result.find((item) => item.itemId === 'potion')).toBeUndefined();
    });

    it('should return unchanged inventory when item does not exist', () => {
      const result = removeItemFromInventory(testInventory, 'nonexistent', 5);
      expect(result).toEqual(testInventory);
    });

    it('should default to quantity 1 when not specified', () => {
      const result = removeItemFromInventory(testInventory, 'potion');
      expect(result[0].quantity).toBe(4);
    });

    it('should not mutate original inventory', () => {
      const original = [...testInventory];
      removeItemFromInventory(testInventory, 'potion', 2);
      expect(testInventory).toEqual(original);
    });
  });

  describe('getItemQuantity', () => {
    it('should return correct quantity for existing item', () => {
      expect(getItemQuantity(testInventory, 'potion')).toBe(5);
      expect(getItemQuantity(testInventory, 'iron-sword')).toBe(1);
    });

    it('should return 0 for non-existent item', () => {
      expect(getItemQuantity(testInventory, 'nonexistent')).toBe(0);
    });

    it('should return 0 for empty inventory', () => {
      expect(getItemQuantity(emptyInventory, 'potion')).toBe(0);
    });
  });

  describe('hasItem', () => {
    it('should return true when item exists with sufficient quantity', () => {
      expect(hasItem(testInventory, 'potion', 3)).toBe(true);
      expect(hasItem(testInventory, 'potion', 5)).toBe(true);
    });

    it('should return false when item exists but insufficient quantity', () => {
      expect(hasItem(testInventory, 'potion', 10)).toBe(false);
    });

    it('should return false when item does not exist', () => {
      expect(hasItem(testInventory, 'nonexistent')).toBe(false);
    });

    it('should default to minQuantity 1 when not specified', () => {
      expect(hasItem(testInventory, 'potion')).toBe(true);
      expect(hasItem(testInventory, 'nonexistent')).toBe(false);
    });
  });

  describe('getUniqueItemCount', () => {
    it('should return correct count of unique items', () => {
      expect(getUniqueItemCount(testInventory)).toBe(3);
    });

    it('should return 0 for empty inventory', () => {
      expect(getUniqueItemCount(emptyInventory)).toBe(0);
    });

    it('should return 1 for single item', () => {
      const inventory: InventoryItem[] = [{ itemId: 'potion', quantity: 50 }];
      expect(getUniqueItemCount(inventory)).toBe(1);
    });
  });

  describe('filterInventoryByType', () => {
    const allItems: BaseItemData[] = [...EquipmentItems, ...ConsumableItems];
    const mixedInventory: InventoryItem[] = [
      { itemId: 'potion', quantity: 5 },
      { itemId: 'iron-sword', quantity: 1 },
      { itemId: 'high-potion', quantity: 3 },
    ];

    it('should filter equipment items only', () => {
      const result = filterInventoryByType(mixedInventory, allItems, 'equipment');
      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('iron-sword');
    });

    it('should filter consumable items only', () => {
      const result = filterInventoryByType(mixedInventory, allItems, 'consumable');
      expect(result).toHaveLength(2);
    });

    it('should return empty for type with no matches', () => {
      const result = filterInventoryByType(mixedInventory, allItems, 'key');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortInventoryByName', () => {
    const allItems: BaseItemData[] = [...EquipmentItems, ...ConsumableItems];

    it('should sort items alphabetically by name', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'iron-sword', quantity: 1 },
        { itemId: 'bronze-armor', quantity: 2 },
        { itemId: 'iron-armor', quantity: 1 },
      ];
      const result = sortInventoryByName(inventory, allItems);
      expect(result[0].itemId).toBe('bronze-armor');
      expect(result[1].itemId).toBe('iron-armor');
      expect(result[2].itemId).toBe('iron-sword');
    });

    it('should not mutate original', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'iron-sword', quantity: 1 },
        { itemId: 'bronze-armor', quantity: 2 },
      ];
      const original = [...inventory];
      sortInventoryByName(inventory, allItems);
      expect(inventory).toEqual(original);
    });
  });

  describe('sortInventoryByQuantity', () => {
    it('should sort by quantity descending', () => {
      const result = sortInventoryByQuantity(testInventory);
      expect(result[0].quantity).toBe(5);
      expect(result[1].quantity).toBe(2);
      expect(result[2].quantity).toBe(1);
    });

    it('should not mutate original', () => {
      const original = [...testInventory];
      sortInventoryByQuantity(testInventory);
      expect(testInventory).toEqual(original);
    });
  });

  describe('getTotalItemCount', () => {
    it('should return total quantity across all items', () => {
      expect(getTotalItemCount(testInventory)).toBe(8); // 5 + 1 + 2
    });

    it('should return 0 for empty inventory', () => {
      expect(getTotalItemCount(emptyInventory)).toBe(0);
    });

    it('should handle single item', () => {
      const inventory: InventoryItem[] = [{ itemId: 'potion', quantity: 50 }];
      expect(getTotalItemCount(inventory)).toBe(50);
    });
  });
});

describe('sortInventoryForDisplay', () => {
  const allItems: BaseItemData[] = [...ConsumableItems, ...EquipmentItems];

  it('orders consumables by definition order regardless of pickup order', () => {
    const picked: InventoryItem[] = [
      { itemId: 'energy-potion', quantity: 1 },
      { itemId: 'potion', quantity: 3 },
      { itemId: 'row-clear', quantity: 2 },
      { itemId: 'high-potion', quantity: 1 },
    ];
    expect(sortInventoryForDisplay(picked, allItems).map((stack) => stack.itemId)).toEqual([
      'potion',
      'high-potion',
      'row-clear',
      'energy-potion',
    ]);
  });

  it('puts weapons before armor', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'iron-armor', quantity: 1, rarity: 'legendary' },
      { itemId: 'iron-sword', quantity: 1, rarity: 'common' },
    ];
    expect(sortInventoryForDisplay(stacks, allItems).map((stack) => stack.itemId)).toEqual([
      'iron-sword',
      'iron-armor',
    ]);
  });

  it('orders the same slot by rarity, highest first', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1, rarity: 'common' },
      { itemId: 'iron-sword', quantity: 1, rarity: 'legendary' },
      { itemId: 'iron-sword', quantity: 1, rarity: 'rare' },
    ];
    expect(sortInventoryForDisplay(stacks, allItems).map((stack) => stack.rarity)).toEqual([
      'legendary',
      'rare',
      'common',
    ]);
  });

  it('treats a missing rarity as common', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1 },
      { itemId: 'iron-sword', quantity: 1, rarity: 'uncommon' },
    ];
    expect(sortInventoryForDisplay(stacks, allItems).map((stack) => stack.rarity)).toEqual(['uncommon', undefined]);
  });

  it('breaks slot and rarity ties by name', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'steel-sword', quantity: 1, rarity: 'common' },
      { itemId: 'bronze-sword', quantity: 1, rarity: 'common' },
    ];
    expect(sortInventoryForDisplay(stacks, allItems).map((stack) => stack.itemId)).toEqual([
      'bronze-sword',
      'steel-sword',
    ]);
  });

  it('puts unknown items last', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'mystery', quantity: 1 },
      { itemId: 'potion', quantity: 1 },
    ];
    expect(sortInventoryForDisplay(stacks, allItems).map((stack) => stack.itemId)).toEqual(['potion', 'mystery']);
  });

  it('does not mutate the input', () => {
    const stacks: InventoryItem[] = [
      { itemId: 'high-potion', quantity: 1 },
      { itemId: 'potion', quantity: 1 },
    ];
    sortInventoryForDisplay(stacks, allItems);
    expect(stacks.map((stack) => stack.itemId)).toEqual(['high-potion', 'potion']);
  });

  it('returns an empty array for an empty inventory', () => {
    expect(sortInventoryForDisplay([], allItems)).toEqual([]);
  });
});

describe('describeConsumableAction', () => {
  it('describes a heal', () => {
    expect(describeConsumableAction({ type: 'heal', amount: 50 })).toBe('Heals 50 HP');
  });

  it('describes row and column clears', () => {
    expect(describeConsumableAction({ type: 'clear-line', orientation: 'row' })).toBe('Clears a row');
    expect(describeConsumableAction({ type: 'clear-line', orientation: 'column' })).toBe('Clears a column');
  });

  it('describes an ultimate fill as a whole percentage', () => {
    expect(describeConsumableAction({ type: 'fill-ultimate', amount: 0.3 })).toBe('Fills 30% Ultimate');
  });

  it('returns null without an action', () => {
    expect(describeConsumableAction(undefined)).toBeNull();
  });
});

describe('getConsumableUsability', () => {
  const potion = ConsumableItems.find((item) => item.id === 'potion')!;
  const rowClear = ConsumableItems.find((item) => item.id === 'row-clear')!;

  it('reports anywhere for items usable in and out of battle', () => {
    expect(getConsumableUsability(potion)).toBe('anywhere');
  });

  it('reports battle for battle-only items', () => {
    expect(getConsumableUsability(rowClear)).toBe('battle');
  });

  it('reports field for out-of-battle-only items', () => {
    expect(getConsumableUsability({ ...potion, usableInBattle: false })).toBe('field');
  });

  it('reports none when neither flag is set', () => {
    expect(getConsumableUsability({ ...potion, usableInBattle: false, usableOutOfBattle: false })).toBe('none');
  });
});
