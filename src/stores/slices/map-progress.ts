import type { MapProgressSlice, MapProgressState, MapNodeType } from './map-progress.types';
import type { SliceSet, SliceGet } from '~/types/store';
import { isNodeCompletedInProgress } from '~/lib/map-content';

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
  foesDefeated: {},
  pendingFoeBattleId: null,
  pendingNodeBattle: null,
});

/** Flag a node done in its type's progress record. Mutates the immer draft. */
function markNodeCompleted(progress: MapProgressState, nodeType: MapNodeType, nodeId: string) {
  switch (nodeType) {
    case 'Battle':
      progress.battlesCompleted[nodeId] = true;
      break;
    case 'Boss':
      progress.bossesCompleted[nodeId] = true;
      break;
    case 'Dungeon':
      progress.dungeonsCompleted[nodeId] = true;
      break;
    case 'Town':
      progress.townsVisited[nodeId] = true;
      break;
    case 'Treasure':
      progress.treasuresFound[nodeId] = true;
      break;
    case 'Mystery':
      progress.mysteriesSolved[nodeId] = true;
      break;
  }
}

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
            markNodeCompleted(state.mapProgress, nodeType, nodeId);
          },
          false,
          'mapProgress/completeNode',
        ),

      isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => {
        const state = get() as MapProgressSlice;
        return isNodeCompletedInProgress(state.mapProgress, nodeType, nodeId);
      },

      setCharacterPosition: (mapId, position) =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress.characterPositions[mapId] = position;
          },
          false,
          'mapProgress/setCharacterPosition',
        ),

      markFoeDefeated: (foeId) =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress.foesDefeated[foeId] = true;
          },
          false,
          'mapProgress/markFoeDefeated',
        ),

      setPendingFoeBattle: (foeId) =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress.pendingFoeBattleId = foeId;
          },
          false,
          'mapProgress/setPendingFoeBattle',
        ),

      setPendingNodeBattle: (battle) =>
        set(
          (state: MapProgressSlice) => {
            state.mapProgress.pendingNodeBattle = battle;
          },
          false,
          'mapProgress/setPendingNodeBattle',
        ),

      resolvePendingBattle: () =>
        set(
          (state: MapProgressSlice) => {
            const { pendingFoeBattleId, pendingNodeBattle } = state.mapProgress;
            if (pendingFoeBattleId !== null) state.mapProgress.foesDefeated[pendingFoeBattleId] = true;
            if (pendingNodeBattle !== null) {
              markNodeCompleted(state.mapProgress, pendingNodeBattle.nodeType, pendingNodeBattle.nodeId);
            }
            state.mapProgress.pendingFoeBattleId = null;
            state.mapProgress.pendingNodeBattle = null;
          },
          false,
          'mapProgress/resolvePendingBattle',
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
