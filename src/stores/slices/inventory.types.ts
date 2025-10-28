import type { InventoryItem } from '~/lib/inventory';
import type { BaseSlice } from '../../types/store';

/**
 * Inventory state
 */
export interface InventoryState {
  items: InventoryItem[];
}

/**
 * Inventory slice actions
 */
export interface InventoryActions {
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  setInventory: (items: InventoryItem[]) => void;
  clearInventory: () => void;
}

/**
 * Complete inventory slice interface
 */
export interface InventorySlice extends BaseSlice {
  inventory: InventoryState;
  actions: {
    inventory: InventoryActions;
  };
}
