import type { RouterState, ViewType, ViewDataMap, NavigationOptions } from '~/types/routing';

/**
 * Router slice interface. Every `goToX` takes optional `NavigationOptions` as its second argument
 * to control what happens to the view being left (`push` by default, `replace` or `reset`).
 */
export interface RouterSlice {
  router: RouterState;
  actions: {
    router: {
      /**
       * Navigate to town hub with required data
       */
      goToTownHub: (data: ViewDataMap['town-hub'], options?: NavigationOptions) => void;

      /**
       * Navigate to battle demo with required data
       */
      goToBattleDemo: (data: ViewDataMap['battle-demo'], options?: NavigationOptions) => void;

      /**
       * Navigate to a dungeon run with required data
       */
      goToDungeon: (data: ViewDataMap['dungeon'], options?: NavigationOptions) => void;

      /**
       * Navigate to a map, selected by `data.mapId`
       */
      goToMap: (data: ViewDataMap['map'], options?: NavigationOptions) => void;

      /**
       * Navigate to dialogue demo
       */
      goToDialogueDemo: (data?: ViewDataMap['dialogue-demo'], options?: NavigationOptions) => void;

      /**
       * Navigate to debug view
       */
      goToDebug: (data?: ViewDataMap['debug'], options?: NavigationOptions) => void;

      /**
       * Navigate to battle rewards; from a battle, replaces it in the history
       */
      goToBattleRewards: (data: ViewDataMap['battle-rewards'], options?: NavigationOptions) => void;

      /**
       * Go back to the previous view, restoring the data it was left with
       */
      goBack: () => void;

      /**
       * Unwind to the nearest occurrence of a view in the history, dropping everything above it
       */
      goBackTo: (view: ViewType) => void;

      /**
       * Set view data without navigating (a stacked view's snapshot is updated too)
       */
      setViewData: <T extends ViewType>(view: T, data: ViewDataMap[T]) => void;

      /**
       * Reset router to initial state
       */
      reset: () => void;
    };
  };
}
