import type { RouterSlice } from './router.types';
import type { ViewType } from '~/types/routing';
import { INITIAL_ROUTER_STATE } from '~/constants/routing';
import {
  prepareGoBack,
  prepareGoBackTo,
  prepareSetViewData,
  goToTownHub as libGoToTownHub,
  goToBattleDemo as libGoToBattleDemo,
  goToMapDemo as libGoToMapDemo,
  goToDialogueDemo as libGoToDialogueDemo,
  goToInventory as libGoToInventory,
  goToDebug as libGoToDebug,
  goToBattleRewards as libGoToBattleRewards,
} from '~/lib/routing';

/**
 * Creates the router slice for the game store
 */
export function createRouterSlice(set: any): RouterSlice {
  return {
    router: INITIAL_ROUTER_STATE,
    actions: {
      router: {
        goToTownHub: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToTownHub(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToBattleDemo: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToBattleDemo(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToMapDemo: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToMapDemo(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToDialogueDemo: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToDialogueDemo(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToInventory: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToInventory(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToDebug: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToDebug(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goToBattleRewards: (data) => {
          set((state: RouterSlice) => {
            const result = libGoToBattleRewards(state.router, data);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Navigation failed: ${result.error}`);
            }
          });
        },

        goBack: () => {
          set((state: RouterSlice) => {
            const result = prepareGoBack(state.router);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Cannot go back: ${result.error}`);
            }
          });
        },

        goBackTo: (view: ViewType) => {
          set((state: RouterSlice) => {
            const result = prepareGoBackTo(state.router, view);
            if (result.success && result.nextState) {
              state.router = result.nextState;
            } else {
              console.warn(`Cannot go back to ${view}: ${result.error}`);
            }
          });
        },

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
