import { produce } from 'immer';
import type { FloorLootProgressSlice, FloorLootProgressState } from './floor-loot-progress.types';
import type { SliceSet, SliceGet } from '~/types/store';

/**
 * Fresh floor loot progress — nothing collected. A factory (not a shared constant)
 * so init and reset each get their own object.
 */
export const createInitialFloorLootProgressState = (): FloorLootProgressState => ({});

/**
 * Floor loot progress slice - tracks collected floor loot spots across all maps
 * This state persists across map transitions to prevent re-collecting loot
 */
export const createFloorLootProgressSlice = (
  set: SliceSet<FloorLootProgressSlice>,
  get: SliceGet<FloorLootProgressSlice>,
): FloorLootProgressSlice => ({
  floorLootProgress: createInitialFloorLootProgressState(),

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
          (state) => {
            state.floorLootProgress = createInitialFloorLootProgressState();
          },
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
