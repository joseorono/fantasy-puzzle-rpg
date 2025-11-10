/**
 * Pure functions for inventory management
 */

import type { BaseItemData } from '~/types/inventory';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';

/**
 * Inventory item with quantity
 */
export interface InventoryItem {
  itemId: string;
  quantity: number;
}

/**
 * Check if an item can be added to inventory
 * @param currentQuantity - Current quantity of the item
 * @param amountToAdd - Amount to add
 * @returns true if the item can be added without exceeding max
 */
export function canAddItem(currentQuantity: number, amountToAdd: number): boolean {
  return currentQuantity + amountToAdd <= MAX_AMOUNT_PER_ITEM;
}

/**
 * Add an item to inventory
 * @param inventory - Current inventory
 * @param itemId - ID of the item to add
 * @param quantity - Quantity to add (default: 1)
 * @returns New inventory with item added
 */
export function addItemToInventory(inventory: InventoryItem[], itemId: string, quantity: number = 1): InventoryItem[] {
  const existingItemIndex = inventory.findIndex((item) => item.itemId === itemId);

  if (existingItemIndex !== -1) {
    // Item exists, update quantity
    const existingItem = inventory[existingItemIndex];
    const newQuantity = Math.min(existingItem.quantity + quantity, MAX_AMOUNT_PER_ITEM);

    return [
      ...inventory.slice(0, existingItemIndex),
      { ...existingItem, quantity: newQuantity },
      ...inventory.slice(existingItemIndex + 1),
    ];
  } else {
    // New item, add to inventory
    return [...inventory, { itemId, quantity: Math.min(quantity, MAX_AMOUNT_PER_ITEM) }];
  }
}

/**
 * Remove an item from inventory
 * @param inventory - Current inventory
 * @param itemId - ID of the item to remove
 * @param quantity - Quantity to remove (default: 1)
 * @returns New inventory with item removed
 */
export function removeItemFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number = 1,
): InventoryItem[] {
  const existingItemIndex = inventory.findIndex((item) => item.itemId === itemId);

  if (existingItemIndex === -1) {
    // Item doesn't exist, return unchanged
    return inventory;
  }

  const existingItem = inventory[existingItemIndex];
  const newQuantity = existingItem.quantity - quantity;

  if (newQuantity <= 0) {
    // Remove item entirely
    return [...inventory.slice(0, existingItemIndex), ...inventory.slice(existingItemIndex + 1)];
  } else {
    // Update quantity
    return [
      ...inventory.slice(0, existingItemIndex),
      { ...existingItem, quantity: newQuantity },
      ...inventory.slice(existingItemIndex + 1),
    ];
  }
}

/**
 * Get the quantity of a specific item in inventory
 * @param inventory - Current inventory
 * @param itemId - ID of the item
 * @returns Quantity of the item (0 if not found)
 */
export function getItemQuantity(inventory: InventoryItem[], itemId: string): number {
  const item = inventory.find((item) => item.itemId === itemId);
  return item ? item.quantity : 0;
}

/**
 * Check if inventory has a specific item with minimum quantity
 * @param inventory - Current inventory
 * @param itemId - ID of the item
 * @param minQuantity - Minimum quantity required (default: 1)
 * @returns true if inventory has the item with at least minQuantity
 */
export function hasItem(inventory: InventoryItem[], itemId: string, minQuantity: number = 1): boolean {
  return getItemQuantity(inventory, itemId) >= minQuantity;
}

/**
 * Get total number of unique items in inventory
 * @param inventory - Current inventory
 * @returns Number of unique items
 */
export function getUniqueItemCount(inventory: InventoryItem[]): number {
  return inventory.length;
}

/**
 * Get total quantity of all items in inventory
 * @param inventory - Current inventory
 * @returns Total quantity across all items
 */
export function getTotalItemCount(inventory: InventoryItem[]): number {
  return inventory.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Filter inventory by item type
 * @param inventory - Current inventory
 * @param items - All available items
 * @param type - Item type to filter by
 * @returns Filtered inventory items
 */
export function filterInventoryByType(
  inventory: InventoryItem[],
  items: BaseItemData[],
  type: 'equipment' | 'consumable' | 'key',
): InventoryItem[] {
  const itemIds = items.filter((item) => item.type === type).map((item) => item.id);
  return inventory.filter((item) => itemIds.includes(item.itemId));
}

/**
 * Sort inventory by item name
 * @param inventory - Current inventory
 * @param items - All available items
 * @returns Sorted inventory
 */
export function sortInventoryByName(inventory: InventoryItem[], items: BaseItemData[]): InventoryItem[] {
  return [...inventory].sort((a, b) => {
    const itemA = items.find((item) => item.id === a.itemId);
    const itemB = items.find((item) => item.id === b.itemId);

    if (!itemA || !itemB) return 0;

    return itemA.name.localeCompare(itemB.name);
  });
}

/**
 * Sort inventory by quantity (descending)
 * @param inventory - Current inventory
 * @returns Sorted inventory
 */
export function sortInventoryByQuantity(inventory: InventoryItem[]): InventoryItem[] {
  return [...inventory].sort((a, b) => b.quantity - a.quantity);
}
