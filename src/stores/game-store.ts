import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ResourcesSlice } from './slices/resources.types';
import { createResourcesSlice } from './slices/resources';
import type { PartySlice } from './slices/party.types';
import { createPartySlice } from './slices/party';
import type { InventorySlice } from './slices/inventory.types';
import { createInventorySlice } from './slices/inventory';
import type { RouterSlice } from './slices/router.types';
import { createRouterSlice } from './slices/router';
import type { MapProgressSlice } from './slices/map-progress.types';
import { createMapProgressSlice } from './slices/map-progress';
import type { FloorLootProgressSlice } from './slices/floor-loot-progress.types';
import { createFloorLootProgressSlice } from './slices/floor-loot-progress';
import { GAME_STORE_NAME } from '~/constants/game';

/**
 * Root game store interface combining all slices
 */
export type GameStore = {
  resources: ResourcesSlice['resources'];
  party: PartySlice['party'];
  inventory: InventorySlice['inventory'];
  router: RouterSlice['router'];
  mapProgress: MapProgressSlice['mapProgress'];
  floorLootProgress: FloorLootProgressSlice['floorLootProgress'];
  actions: ResourcesSlice['actions'] &
    PartySlice['actions'] &
    InventorySlice['actions'] &
    RouterSlice['actions'] &
    MapProgressSlice['actions'] &
    FloorLootProgressSlice['actions'];
  reset?: () => void;
};

/**
 * Main game store with DevTools and immer middleware
 */
export const useGameStore = create<GameStore>()(
  devtools(
    immer((set, get) => {
      const resourcesSlice = createResourcesSlice(set);
      const partySlice = createPartySlice(set);
      const inventorySlice = createInventorySlice(set);
      const routerSlice = createRouterSlice(set);
      const mapProgressSlice = createMapProgressSlice(set, get);
      const floorLootProgressSlice = createFloorLootProgressSlice(set, get);
      return {
        ...resourcesSlice,
        ...partySlice,
        ...inventorySlice,
        ...routerSlice,
        ...mapProgressSlice,
        ...floorLootProgressSlice,
        actions: {
          ...resourcesSlice.actions,
          ...partySlice.actions,
          ...inventorySlice.actions,
          ...routerSlice.actions,
          ...mapProgressSlice.actions,
          ...floorLootProgressSlice.actions,
        },
      };
    }),
    {
      name: GAME_STORE_NAME,
      enabled: process.env.NODE_ENV !== 'production',
    },
  ),
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

/**
 * Selector hooks for router slice
 */
export const useRouterState = () => useGameStore((state) => state.router);
export const useRouterActions = () => useGameStore((state) => state.actions.router);

/**
 * Get the current view
 */
export const useCurrentView = () => useGameStore((state) => state.router.currentView);

/**
 * Get view data for a specific view
 */
export const useViewData = <T extends keyof import('~/types/routing').ViewDataMap>(view: T) =>
  useGameStore((state) => state.router.viewData[view]);

/**
 * Selector hooks for map progress slice
 */
export const useMapProgressState = () => useGameStore((state) => state.mapProgress);
export const useMapProgressActions = () => useGameStore((state) => state.actions.mapProgress);

/**
 * Selector hooks for floor loot progress slice
 */
export const useFloorLootProgressState = () => useGameStore((state) => state.floorLootProgress);
export const useFloorLootProgressActions = () => useGameStore((state) => state.actions.floorLootProgress);

