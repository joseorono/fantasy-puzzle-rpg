import type { ResourcesSlice } from './resources.types';
import { addResources as addResourcesLib, deductCost } from '../../lib/resources';
import { INITIAL_RESOURCES_STATE } from '../../constants/resources';
import type { Resources } from '~/types/resources';

/**
 * Create the resources slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createResourcesSlice = (set: any): ResourcesSlice => ({
  resources: INITIAL_RESOURCES_STATE,

  actions: {
    resources: {
      addResources: (toAdd: Resources) =>
        set(
          (state: ResourcesSlice) => {
            state.resources = addResourcesLib(state.resources, toAdd);
          },
          false,
          'resources/addResources',
        ),

      reduceResources: (cost: Resources) =>
        set(
          (state: ResourcesSlice) => {
            state.resources = deductCost(state.resources, cost);
          },
          false,
          'resources/reduceResources',
        ),

      setResources: (resources: Resources) =>
        set(
          (state: ResourcesSlice) => {
            state.resources = resources;
          },
          false,
          'resources/setResources',
        ),
    },
  },

  reset: () =>
    set(
      (state: ResourcesSlice) => {
        state.resources = INITIAL_RESOURCES_STATE;
      },
      false,
      'resources/reset',
    ),
});
