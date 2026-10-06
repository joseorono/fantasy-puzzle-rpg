/**
 * Pure functions for inventory management
 */

import type { BaseItemData, ConsumableAction, ConsumableItemData } from '~/types/inventory';
import { DEFAULT_RARITY, RARITY_TIERS, type RarityTier } from '~/constants/rarity';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';
import { getEquipmentSlot } from '~/lib/equipment-system';

/**
 * Inventory item with quantity.
 *
 * `rarity` is the rolled tier for equipment instances; it is part of the stack
 * key, so a Common and a Rare copy of the same item are separate stacks.
 * Consumables and key items leave it undefined and stack purely by `itemId`.
 */
export interface InventoryItem {
  itemId: string;
  quantity: number;
  rarity?: RarityTier;
}

/**
 * Two inventory entries belong to the same stack when they share both item id
 * and rolled rarity (undefined rarity matches undefined — i.e. consumables).
 */
function isSameStack(item: InventoryItem, itemId: string, rarity?: RarityTier): boolean {
  return item.itemId === itemId && item.rarity === rarity;
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
 * @param rarity - Rolled rarity for equipment instances; omit for consumables/key items
 * @returns New inventory with item added
 */
export function addItemToInventory(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number = 1,
  rarity?: RarityTier,
): InventoryItem[] {
  const existingItemIndex = inventory.findIndex((item) => isSameStack(item, itemId, rarity));

  if (existingItemIndex !== -1) {
    // Stack exists (same id + rarity), update quantity
    const existingItem = inventory[existingItemIndex];
    const newQuantity = Math.min(existingItem.quantity + quantity, MAX_AMOUNT_PER_ITEM);

    return [
      ...inventory.slice(0, existingItemIndex),
      { ...existingItem, quantity: newQuantity },
      ...inventory.slice(existingItemIndex + 1),
    ];
  } else {
    // New stack, add to inventory (only carry a rarity key when it's defined)
    const newItem: InventoryItem = { itemId, quantity: Math.min(quantity, MAX_AMOUNT_PER_ITEM) };
    if (rarity) newItem.rarity = rarity;
    return [...inventory, newItem];
  }
}

/**
 * Remove an item from inventory
 * @param inventory - Current inventory
 * @param itemId - ID of the item to remove
 * @param quantity - Quantity to remove (default: 1)
 * @param rarity - Rarity of the stack to remove from; omit for consumables/key items
 * @returns New inventory with item removed
 */
export function removeItemFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number = 1,
  rarity?: RarityTier,
): InventoryItem[] {
  const existingItemIndex = inventory.findIndex((item) => isSameStack(item, itemId, rarity));

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
 * Get the quantity of a specific item in inventory.
 *
 * Without `rarity`, sums every stack of `itemId` regardless of tier (useful for
 * "do I own any of this?" checks and for consumables, which have no rarity).
 * With `rarity`, returns the quantity of that exact tier's stack only.
 * @param inventory - Current inventory
 * @param itemId - ID of the item
 * @param rarity - Optional rarity tier to match exactly
 * @returns Quantity of the item (0 if not found)
 */
export function getItemQuantity(inventory: InventoryItem[], itemId: string, rarity?: RarityTier): number {
  if (rarity === undefined) {
    return inventory.reduce((total, item) => (item.itemId === itemId ? total + item.quantity : total), 0);
  }
  const item = inventory.find((item) => isSameStack(item, itemId, rarity));
  return item ? item.quantity : 0;
}

/**
 * Check if inventory has a specific item with minimum quantity
 * @param inventory - Current inventory
 * @param itemId - ID of the item
 * @param minQuantity - Minimum quantity required (default: 1)
 * @param rarity - Optional rarity tier to match exactly
 * @returns true if inventory has the item with at least minQuantity
 */
export function hasItem(
  inventory: InventoryItem[],
  itemId: string,
  minQuantity: number = 1,
  rarity?: RarityTier,
): boolean {
  return getItemQuantity(inventory, itemId, rarity) >= minQuantity;
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

/** Where a consumable can be used: in battle, on the field (out of battle), both, or neither. */
export type ConsumableUsability = 'anywhere' | 'battle' | 'field' | 'none';

/** Weapons list before armor; anything without a slot goes last. */
function getSlotRank(itemId: string): number {
  const slot = getEquipmentSlot(itemId);
  if (slot === 'weapon') return 0;
  if (slot === 'armor') return 1;
  return 2;
}

/** Position of a stack's rolled rarity in `RARITY_TIERS` (higher is rarer). */
function getRarityRank(rarity: RarityTier | undefined): number {
  return RARITY_TIERS.indexOf(rarity ?? DEFAULT_RARITY);
}

/**
 * Display order for one category of the pause-menu Items list.
 *
 * Equipment sorts by slot (weapons before armor), then rarity from highest to lowest,
 * then name. Everything else keeps the order its definition has in `items`, so the
 * potions always read the same way regardless of pickup order. Stacks whose item is
 * not in `items` go last. The input array is not mutated.
 * @param inventory - Stacks to sort, usually one category's worth
 * @param items - Item definitions, in their canonical order
 * @returns A new, sorted array
 */
export function sortInventoryForDisplay(inventory: InventoryItem[], items: BaseItemData[]): InventoryItem[] {
  const indexById = new Map(items.map((item, index) => [item.id, index]));

  return [...inventory].sort((a, b) => {
    const indexA = indexById.get(a.itemId);
    const indexB = indexById.get(b.itemId);
    if (indexA === undefined || indexB === undefined) {
      return (indexA === undefined ? 1 : 0) - (indexB === undefined ? 1 : 0);
    }

    const itemA = items[indexA];
    const itemB = items[indexB];
    if (itemA.type !== 'equipment' || itemB.type !== 'equipment') return indexA - indexB;

    const slotDiff = getSlotRank(itemA.id) - getSlotRank(itemB.id);
    if (slotDiff !== 0) return slotDiff;
    const rarityDiff = getRarityRank(b.rarity) - getRarityRank(a.rarity);
    if (rarityDiff !== 0) return rarityDiff;
    return itemA.name.localeCompare(itemB.name);
  });
}

/**
 * One-line description of what a consumable does, for the item detail card.
 * @param action - The consumable's action, if any
 * @returns e.g. "Heals 50 HP", "Clears a row", "Fills 30% Ultimate"; `null` without an action
 */
export function describeConsumableAction(action: ConsumableAction | undefined): string | null {
  if (!action) return null;
  if (action.type === 'heal') return `Heals ${action.amount} HP`;
  if (action.type === 'clear-line') return `Clears a ${action.orientation}`;
  return `Fills ${Math.round(action.amount * 100)}% Ultimate`;
}

/**
 * Where a consumable may be used, from its `usableInBattle` / `usableOutOfBattle` flags.
 * @param item - Consumable definition
 * @returns `'anywhere'`, `'battle'`, `'field'` or `'none'`
 */
export function getConsumableUsability(item: ConsumableItemData): ConsumableUsability {
  if (item.usableInBattle && item.usableOutOfBattle) return 'anywhere';
  if (item.usableInBattle) return 'battle';
  if (item.usableOutOfBattle) return 'field';
  return 'none';
}
