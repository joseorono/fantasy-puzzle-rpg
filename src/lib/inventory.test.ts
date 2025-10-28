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
} from './inventory';
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

  describe('removeItemFromInventory', () => {
    it('should decrease quantity of existing item', () => {
      const result = removeItemFromInventory(testInventory, 'potion', 2);
      expect(result[0]).toEqual({ itemId: 'potion', quantity: 3 });
    });

    it('should remove item when quantity reaches zero', () => {
      const result = removeItemFromInventory(testInventory, 'iron-sword', 1);
      expect(result).toHaveLength(2);
      expect(result.find(item => item.itemId === 'iron-sword')).toBeUndefined();
    });

    it('should remove item when removing more than available', () => {
      const result = removeItemFromInventory(testInventory, 'potion', 10);
      expect(result).toHaveLength(2);
      expect(result.find(item => item.itemId === 'potion')).toBeUndefined();
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
