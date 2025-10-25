import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ResourcesSlice } from './slices/resources.types';
import { createResourcesSlice } from './slices/resources';
import { GAME_STORE_NAME, GAME_STORE_VERSION } from '~/constants/game';

/**
 * Root game store interface combining all slices
 */
export type GameStore = ResourcesSlice;

/**
 * Main game store with DevTools, immer, and persist middleware
 */
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...createResourcesSlice(set),
      })),
      {
        name: GAME_STORE_NAME,
        version: GAME_STORE_VERSION,
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
