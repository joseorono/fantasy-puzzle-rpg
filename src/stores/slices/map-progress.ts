import type { MapProgressSlice, MapNodeType } from './map-progress.types';

/**
 * Initial map progress state
 */
const INITIAL_MAP_PROGRESS_STATE = {
  battlesCompleted: {},
  bossesCompleted: {},
  dungeonsCompleted: {},
  townsVisited: {},
  questsCompleted: {},
  treasuresFound: {},
  mysteriesSolved: {},
  shopsVisited: {},
};

/**
 * Create the map progress slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createMapProgressSlice = (set: any, get: any): MapProgressSlice => ({
  mapProgress: INITIAL_MAP_PROGRESS_STATE,

  actions: {
    mapProgress: {
      completeNode: (nodeType: MapNodeType, nodeId: string) =>
        set(
          (state: MapProgressSlice) => {
            switch (nodeType) {
              case 'Battle':
                state.mapProgress.battlesCompleted[nodeId] = true;
                break;
              case 'Boss':
                state.mapProgress.bossesCompleted[nodeId] = true;
                break;
              case 'Dungeon':
                state.mapProgress.dungeonsCompleted[nodeId] = true;
                break;
              case 'Town':
                state.mapProgress.townsVisited[nodeId] = true;
                break;
              case 'Quest':
                state.mapProgress.questsCompleted[nodeId] = true;
                break;
              case 'Treasure':
                state.mapProgress.treasuresFound[nodeId] = true;
                break;
              case 'Mystery':
                state.mapProgress.mysteriesSolved[nodeId] = true;
                break;
              case 'Shop':
                state.mapProgress.shopsVisited[nodeId] = true;
                break;
            }
          },
          false,
          'mapProgress/completeNode',
        ),

      isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => {
        const state = get() as MapProgressSlice;
        switch (nodeType) {
          case 'Battle':
            return state.mapProgress.battlesCompleted[nodeId] === true;
          case 'Boss':
            return state.mapProgress.bossesCompleted[nodeId] === true;
          case 'Dungeon':
            return state.mapProgress.dungeonsCompleted[nodeId] === true;
          case 'Town':
            return state.mapProgress.townsVisited[nodeId] === true;
          case 'Quest':
            return state.mapProgress.questsCompleted[nodeId] === true;
          case 'Treasure':
            return state.mapProgress.treasuresFound[nodeId] === true;
          case 'Mystery':
            return state.mapProgress.mysteriesSolved[nodeId] === true;
          case 'Shop':
            return state.mapProgress.shopsVisited[nodeId] === true;
          default:
            return false;
        }
      },

      resetProgress: () =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress = INITIAL_MAP_PROGRESS_STATE;
          },
          false,
          'mapProgress/resetProgress',
        ),
    },
  },

  reset: () =>
    set(
      (state: MapProgressSlice) => {
        state.mapProgress = INITIAL_MAP_PROGRESS_STATE;
      },
      false,
      'mapProgress/reset',
    ),
});

