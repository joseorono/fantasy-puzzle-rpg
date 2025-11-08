import type { RouterState, ViewType, ViewDataMap } from '~/types/routing';

/**
 * Router slice interface
 */
export interface RouterSlice {
  router: RouterState;
  actions: {
    router: {
      /**
       * Navigate to town hub with required data
       */
      goToTownHub: (data: ViewDataMap['town-hub']) => void;

      /**
       * Navigate to battle demo with required data
       */
      goToBattleDemo: (data: ViewDataMap['battle-demo']) => void;

      /**
       * Navigate to map demo
       */
      goToMapDemo: (data?: ViewDataMap['map-demo']) => void;

      /**
       * Navigate to dialogue demo
       */
      goToDialogueDemo: (data?: ViewDataMap['dialogue-demo']) => void;

      /**
       * Navigate to level up screen
       */
      goToLevelUp: (data: ViewDataMap['level-up']) => void;

      /**
       * Navigate to inventory
       */
      goToInventory: (data?: ViewDataMap['inventory']) => void;

      /**
       * Navigate to level up demo
       */
      goToLevelUpDemo: (data?: ViewDataMap['level-up-demo']) => void;

      /**
       * Navigate to debug view
       */
      goToDebug: (data?: ViewDataMap['debug']) => void;

      /**
       * Go back to previous view
       */
      goBack: () => void;

      /**
       * Go back to a specific view in history
       */
      goBackTo: (view: ViewType) => void;

      /**
       * Set view data without navigating
       */
      setViewData: <T extends ViewType>(view: T, data: ViewDataMap[T]) => void;

      /**
       * Reset router to initial state
       */
      reset: () => void;
    };
  };
}
