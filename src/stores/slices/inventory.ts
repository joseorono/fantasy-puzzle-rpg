import type { InventorySlice } from './inventory.types';
import { addItemToInventory, removeItemFromInventory } from '../../lib/inventory';
import type { InventoryItem } from '~/lib/inventory';

/**
 * Initial inventory state
 */
const INITIAL_INVENTORY_STATE: InventoryItem[] = [
  { itemId: 'potion', quantity: 3 },
  { itemId: 'high-potion', quantity: 2 },
  { itemId: 'row-clear', quantity: 2 },
  { itemId: 'column-clear', quantity: 2 },
];

/**
 * Create the inventory slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createInventorySlice = (set: any): InventorySlice => ({
  inventory: {
    items: INITIAL_INVENTORY_STATE,
  },

  actions: {
    inventory: {
      addItem: (itemId: string, quantity: number = 1) =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = addItemToInventory(state.inventory.items, itemId, quantity);
          },
          false,
          'inventory/addItem',
        ),

      removeItem: (itemId: string, quantity: number = 1) =>
        set(
          (state: InventorySlice) => {
            state.inventory.items = removeItemFromInventory(state.inventory.items, itemId, quantity);
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

  reset: () =>
    set(
      (state: InventorySlice) => {
        state.inventory.items = INITIAL_INVENTORY_STATE;
      },
      false,
      'inventory/reset',
    ),
});
