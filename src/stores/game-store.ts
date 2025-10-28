import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ResourcesSlice } from './slices/resources.types';
import { createResourcesSlice } from './slices/resources';
import type { PartySlice } from './slices/party.types';
import { createPartySlice } from './slices/party';
import type { InventorySlice } from './slices/inventory.types';
import { createInventorySlice } from './slices/inventory';
import { GAME_STORE_NAME, GAME_STORE_VERSION } from '~/constants/game';

/**
 * Root game store interface combining all slices
 */
export type GameStore = {
  resources: ResourcesSlice['resources'];
  party: PartySlice['party'];
  inventory: InventorySlice['inventory'];
  actions: ResourcesSlice['actions'] & PartySlice['actions'] & InventorySlice['actions'];
  reset?: () => void;
};

/**
 * Main game store with DevTools, immer, and persist middleware
 */
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      immer((set) => {
        const resourcesSlice = createResourcesSlice(set);
        const partySlice = createPartySlice(set);
        const inventorySlice = createInventorySlice(set);
        return {
          ...resourcesSlice,
          ...partySlice,
          ...inventorySlice,
          actions: {
            ...resourcesSlice.actions,
            ...partySlice.actions,
            ...inventorySlice.actions,
          },
        };
      }),
      {
        name: GAME_STORE_NAME,
        version: GAME_STORE_VERSION,
        partialize: (state) => ({
          resources: state.resources,
          party: state.party,
          inventory: state.inventory,
        }),
        // Optionally, you can add migration logic here for version changes
        // migrate: (persistedState: any, version: number) => {
        //   if (version === 0) {
        //     // migrate from version 0 to version 1
        //   }
        //   return persistedState as GameStore;
        // },
      }
    ),
    {
      name: GAME_STORE_NAME,
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
);

/**
 * Selector hooks for easy access to store slices
 */
export const useResourcesState = () => useGameStore((state) => state.resources);
export const useResourcesActions = () => useGameStore((state) => state.actions.resources);

/**
 * Get the current resources
 */
export const useResources = () => useGameStore((state) => state.resources);

/**
 * Selector hooks for party slice
 */
export const usePartyState = () => useGameStore((state) => state.party);
export const usePartyActions = () => useGameStore((state) => state.actions.party);

/**
 * Get the current party
 */
export const useParty = () => useGameStore((state) => state.party.members);

/**
 * Selector hooks for inventory slice
 */
export const useInventoryState = () => useGameStore((state) => state.inventory);
export const useInventoryActions = () => useGameStore((state) => state.actions.inventory);

/**
 * Get the current inventory items
 */
export const useInventory = () => useGameStore((state) => state.inventory.items);
