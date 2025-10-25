import type { Resources } from '~/types/resources';
import type { BaseSlice } from '../../types/store';

/**
 * Resources state
 */
export interface ResourcesState extends Resources {}

/**
 * Resources slice actions
 */
export interface ResourcesActions {
  addResources: (resources: Resources) => void;
  setResources: (resources: Resources) => void;
}

/**
 * Complete resources slice interface
 */
export interface ResourcesSlice extends BaseSlice {
  resources: ResourcesState;
  actions: {
    resources: ResourcesActions;
  };
}
