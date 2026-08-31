import type { InventorySlice } from './inventory.types';
import { addItemToInventory, removeItemFromInventory } from '../../lib/inventory';
import type { InventoryItem } from '~/lib/inventory';
import type { RarityTier } from '~/constants/rarity';
import type { SliceSet } from '~/types/store';

/**
 * Fresh starting inventory. A factory (not a shared constant) so a new game and the
 * initial store each get their own array, and stack edits can't leak across a reset.
 */
export const createInitialInventoryState = (): InventoryItem[] => [
  { itemId: 'potion', quantity: 3 },
  { itemId: 'high-potion', quantity: 2 },
  { itemId: 'row-clear', quantity: 2 },
  { itemId: 'column-clear', quantity: 2 },
  { itemId: 'energy-potion', quantity: 1 },
];

/**
 * Create the inventory slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createInventorySlice = (set: SliceSet<InventorySlice>): InventorySlice => ({
  inventory: {
    items: createInitialInventoryState(),
  },

  actions: {
    inventory: {
      addItem: (itemId: string, quantity: number = 1, rarity?: RarityTier) =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = addItemToInventory(state.inventory.items, itemId, quantity, rarity);
          },
          false,
          'inventory/addItem',
        ),

      removeItem: (itemId: string, quantity: number = 1, rarity?: RarityTier) =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = removeItemFromInventory(state.inventory.items, itemId, quantity, rarity);
          },
          false,
          'inventory/removeItem',
        ),

      setInventory: (items: InventoryItem[]) =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = items;
          },
          false,
          'inventory/setInventory',
        ),

      clearInventory: () =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = [];
          },
          false,
          'inventory/clearInventory',
        ),
    },
  },
});
