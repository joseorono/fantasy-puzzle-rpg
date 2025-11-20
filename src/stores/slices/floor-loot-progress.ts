import { produce } from 'immer';
import type { FloorLootProgressSlice, FloorLootProgressState } from './floor-loot-progress.types';

const INITIAL_FLOOR_LOOT_PROGRESS_STATE: FloorLootProgressState = {};

/**
 * Floor loot progress slice - tracks collected floor loot spots across all maps
 * This state persists across map transitions to prevent re-collecting loot
 */
export const createFloorLootProgressSlice = (set: any, get: any): FloorLootProgressSlice => ({
  floorLootProgress: INITIAL_FLOOR_LOOT_PROGRESS_STATE,

  actions: {
    floorLootProgress: {
      collectFloorLoot: (mapId: string, lootId: string) =>
        set(
          produce((state: FloorLootProgressSlice) => {
            if (!state.floorLootProgress[mapId]) {
              state.floorLootProgress[mapId] = {};
            }
            state.floorLootProgress[mapId][lootId] = true;
          }),
          false,
          'floorLootProgress/collectFloorLoot',
        ),

      isFloorLootCollected: (mapId: string, lootId: string) => {
        const state = get() as FloorLootProgressSlice;
        return state.floorLootProgress[mapId]?.[lootId] ?? false;
      },

      resetFloorLootProgress: () =>
        set(
          { floorLootProgress: INITIAL_FLOOR_LOOT_PROGRESS_STATE },
          false,
          'floorLootProgress/resetFloorLootProgress',
        ),

      resetMapFloorLootProgress: (mapId: string) =>
        set(
          produce((state: FloorLootProgressSlice) => {
            delete state.floorLootProgress[mapId];
          }),
          false,
          'floorLootProgress/resetMapFloorLootProgress',
        ),
    },
  },
});
