import type { MapProgressSlice, MapProgressState, MapNodeType } from './map-progress.types';
import type { SliceSet, SliceGet } from '~/types/store';

/**
 * Fresh map progress — nothing completed, nobody placed. A factory (not a shared
 * constant) so init and reset each get their own object and progress can never
 * leak across a reset.
 */
export const createInitialMapProgressState = (): MapProgressState => ({
  battlesCompleted: {},
  bossesCompleted: {},
  dungeonsCompleted: {},
  townsVisited: {},
  treasuresFound: {},
  mysteriesSolved: {},
  characterPositions: {},
});

/**
 * Create the map progress slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createMapProgressSlice = (
  set: SliceSet<MapProgressSlice>,
  get: SliceGet<MapProgressSlice>,
): MapProgressSlice => ({
  mapProgress: createInitialMapProgressState(),

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
              case 'Treasure':
                state.mapProgress.treasuresFound[nodeId] = true;
                break;
              case 'Mystery':
                state.mapProgress.mysteriesSolved[nodeId] = true;
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
          case 'Treasure':
            return state.mapProgress.treasuresFound[nodeId] === true;
          case 'Mystery':
            return state.mapProgress.mysteriesSolved[nodeId] === true;
          default:
            return false;
        }
      },

      setCharacterPosition: (mapId, position) =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress.characterPositions[mapId] = position;
          },
          false,
          'mapProgress/setCharacterPosition',
        ),

      resetProgress: () =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress = createInitialMapProgressState();
          },
          false,
          'mapProgress/resetProgress',
        ),
    },
  },
});

