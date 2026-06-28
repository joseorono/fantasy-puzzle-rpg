import type { DungeonProgressSlice } from './dungeon-progress.types';
import type { SliceSet, SliceGet } from '~/types/store';

/**
 * Initial dungeon progress state — nothing completed.
 */
const INITIAL_DUNGEON_PROGRESS_STATE = {
  completedDungeons: {},
};

/**
 * Create the dungeon progress slice.
 *
 * Holds only persisted completion flags. `markDungeonCompleted` is intended to be
 * the single store write of a dungeon run, fired once when the last floor's last
 * event resolves. Designed for immer middleware (mutate the draft directly).
 */
export const createDungeonProgressSlice = (
  set: SliceSet<DungeonProgressSlice>,
  get: SliceGet<DungeonProgressSlice>,
): DungeonProgressSlice => ({
  dungeonProgress: INITIAL_DUNGEON_PROGRESS_STATE,

  actions: {
    dungeonProgress: {
      markDungeonCompleted: (dungeonId: string) =>
        set(
          (state: DungeonProgressSlice) => {
            state.dungeonProgress.completedDungeons[dungeonId] = true;
          },
          false,
          'dungeonProgress/markDungeonCompleted',
        ),

      isDungeonCompleted: (dungeonId: string) => {
        const state = get() as DungeonProgressSlice;
        return state.dungeonProgress.completedDungeons[dungeonId] === true;
      },
    },
  },

  reset: () =>
    set(
      (state: DungeonProgressSlice) => {
        state.dungeonProgress = INITIAL_DUNGEON_PROGRESS_STATE;
      },
      false,
      'dungeonProgress/reset',
    ),
});
