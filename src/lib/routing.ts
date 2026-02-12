import type { RouterState, ViewType, ViewDataMap, NavigationResult } from '~/types/routing';

/**
 * Validates if a view transition is allowed
 */
export function canNavigate(_currentState: RouterState, _targetView: ViewType): boolean {
  // Always allow navigation for now
  // Add custom validation logic here if needed (e.g., prevent going to battle from certain views)
  return true;
}

/**
 * Prepares a navigation to a new view
 */
export function prepareNavigation<T extends ViewType>(
  currentState: RouterState,
  targetView: T,
  viewData?: ViewDataMap[T],
): NavigationResult {
  if (!canNavigate(currentState, targetView)) {
    return {
      success: false,
      error: `Cannot navigate from ${currentState.currentView} to ${targetView}`,
    };
  }

  const nextState: RouterState = {
    currentView: targetView,
    previousView: currentState.currentView,
    viewData: {
      ...currentState.viewData,
      ...(viewData ? { [targetView]: viewData } : {}),
    },
  };

  return {
    success: true,
    nextState,
  };
}

/**
 * Prepares navigation to the previous view
 */
export function prepareGoBack(currentState: RouterState): NavigationResult {
  if (!currentState.previousView) {
    return {
      success: false,
      error: 'No previous view to navigate to',
    };
  }

  const nextState: RouterState = {
    currentView: currentState.previousView,
    previousView: null, // Clear previous view since we don't track full history
    viewData: currentState.viewData,
  };

  return {
    success: true,
    nextState,
  };
}

/**
 * Prepares navigation back to a specific view
 * WARNING: Use with caution - can cause illogical navigation flows.
 * This directly jumps to a view without maintaining proper navigation state.
 * Prefer using direct navigation functions (goToTownHub, etc.) instead.
 */
export function prepareGoBackTo(currentState: RouterState, targetView: ViewType): NavigationResult {
  const nextState: RouterState = {
    currentView: targetView,
    previousView: currentState.currentView,
    viewData: currentState.viewData,
  };

  return {
    success: true,
    nextState,
  };
}

/**
 * Updates view data without navigating
 */
export function prepareSetViewData<T extends ViewType>(
  currentState: RouterState,
  view: T,
  data: ViewDataMap[T],
): RouterState {
  return {
    ...currentState,
    viewData: {
      ...currentState.viewData,
      [view]: data,
    },
  };
}

/**
 * Gets view data for a specific view
 */
export function getViewData<T extends ViewType>(state: RouterState, view: T): ViewDataMap[T] | undefined {
  return state.viewData[view] as ViewDataMap[T] | undefined;
}

/**
 * Checks if we can go back
 */
export function canGoBack(state: RouterState): boolean {
  return state.previousView !== null;
}

// ============================================================================
// Type-safe navigation functions for each view
// ============================================================================

/**
 * Navigate to town hub with required data
 */
export function goToTownHub(currentState: RouterState, data: ViewDataMap['town-hub']): NavigationResult {
  return prepareNavigation(currentState, 'town-hub', data);
}

/**
 * Navigate to battle demo with required data
 */
export function goToBattleDemo(currentState: RouterState, data: ViewDataMap['battle-demo']): NavigationResult {
  return prepareNavigation(currentState, 'battle-demo', data);
}

/**
 * Navigate to map demo
 */
export function goToMapDemo(currentState: RouterState, data?: ViewDataMap['map-demo']): NavigationResult {
  return prepareNavigation(currentState, 'map-demo', data ?? {});
}

/**
 * Navigate to dialogue demo
 */
export function goToDialogueDemo(currentState: RouterState, data?: ViewDataMap['dialogue-demo']): NavigationResult {
  return prepareNavigation(currentState, 'dialogue-demo', data ?? {});
}

/**
 * Navigate to inventory
 */
export function goToInventory(currentState: RouterState, data?: ViewDataMap['inventory']): NavigationResult {
  return prepareNavigation(currentState, 'inventory', data ?? {});
}

/**
 * Navigate to debug view
 */
export function goToDebug(currentState: RouterState, data?: ViewDataMap['debug']): NavigationResult {
  return prepareNavigation(currentState, 'debug', data ?? {});
}

/**
 * Navigate to battle rewards
 * Preserves the pre-battle previousView so that goBack() from rewards
 * returns to the view before battle (map, town, etc.) instead of back to battle.
 */
export function goToBattleRewards(currentState: RouterState, data: ViewDataMap['battle-rewards']): NavigationResult {
  if (!canNavigate(currentState, 'battle-rewards')) {
    return {
      success: false,
      error: `Cannot navigate from ${currentState.currentView} to battle-rewards`,
    };
  }

  const nextState: RouterState = {
    currentView: 'battle-rewards',
    previousView: currentState.previousView, // keep pre-battle view, not battle
    viewData: {
      ...currentState.viewData,
      'battle-rewards': data,
    },
  };

  return {
    success: true,
    nextState,
  };
}
