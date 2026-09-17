import type { RouterSlice } from './router.types';
import type { NavigationResult, ViewType } from '~/types/routing';
import { INITIAL_ROUTER_STATE } from '~/constants/routing';
import {
  prepareGoBack,
  prepareGoBackTo,
  prepareSetViewData,
  goToTownHub as libGoToTownHub,
  goToBattleDemo as libGoToBattleDemo,
  goToDungeon as libGoToDungeon,
  goToMap as libGoToMap,
  goToDialogueDemo as libGoToDialogueDemo,
  goToDebug as libGoToDebug,
  goToBattleRewards as libGoToBattleRewards,
} from '~/lib/routing';
import type { SliceSet } from '~/types/store';

/**
 * Creates the router slice for the game store
 */
export function createRouterSlice(set: SliceSet<RouterSlice>): RouterSlice {
  /** Applies a navigation result to the store, or reports why it was refused. */
  function commit(navigate: (state: RouterSlice) => NavigationResult, failure: string) {
    set((state: RouterSlice) => {
      const result = navigate(state);
      if (result.success && result.nextState) {
        state.router = result.nextState;
      } else {
        console.warn(`${failure}: ${result.error}`);
      }
    });
  }

  return {
    router: INITIAL_ROUTER_STATE,
    actions: {
      router: {
        goToTownHub: (data, options) =>
          commit((state) => libGoToTownHub(state.router, data, options), 'Navigation failed'),

        goToBattleDemo: (data, options) =>
          commit((state) => libGoToBattleDemo(state.router, data, options), 'Navigation failed'),

        goToDungeon: (data, options) =>
          commit((state) => libGoToDungeon(state.router, data, options), 'Navigation failed'),

        goToMap: (data, options) => commit((state) => libGoToMap(state.router, data, options), 'Navigation failed'),

        goToDialogueDemo: (data, options) =>
          commit((state) => libGoToDialogueDemo(state.router, data, options), 'Navigation failed'),

        goToDebug: (data, options) => commit((state) => libGoToDebug(state.router, data, options), 'Navigation failed'),

        goToBattleRewards: (data, options) =>
          commit((state) => libGoToBattleRewards(state.router, data, options), 'Navigation failed'),

        goBack: () => commit((state) => prepareGoBack(state.router), 'Cannot go back'),

        goBackTo: (view: ViewType) =>
          commit((state) => prepareGoBackTo(state.router, view), `Cannot go back to ${view}`),

        setViewData: (view, data) => {
          set((state: RouterSlice) => {
            state.router = prepareSetViewData(state.router, view, data);
          });
        },

        reset: () => {
          set((state: RouterSlice) => {
            state.router = INITIAL_ROUTER_STATE;
          });
        },
      },
    },
  };
}
