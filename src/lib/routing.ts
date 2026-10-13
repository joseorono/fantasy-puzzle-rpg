import type {
  RouterState,
  ViewType,
  ViewDataMap,
  NavigationResult,
  NavigationOptions,
  HistoryEntry,
  HistoryMode,
} from '~/types/routing';
import { ROUTER_HISTORY_LIMIT } from '~/constants/routing';

/**
 * Validates if a view transition is allowed
 */
export function canNavigate(): boolean {
  // Always allow navigation for now
  // Add custom validation logic here if needed (e.g., prevent going to battle from certain views)
  return true;
}

/**
 * Prepares a navigation to a new view.
 *
 * By default the view being left is stacked with its data (`push`) so `goBack()` can restore it;
 * `options.history` can instead drop it (`replace`) or empty the stack (`reset`) — see
 * `HistoryMode`. Navigating to the view already on screen is an ordinary push: the old data sits
 * in the snapshot and the new data goes live, so map → map works like any other round-trip.
 * @param currentState The router state to navigate from.
 * @param targetView The view to show.
 * @param viewData Data for the target view; when omitted, its last-known data is kept.
 * @param options What to do with the view being left.
 */
export function prepareNavigation<T extends ViewType>(
  currentState: RouterState,
  targetView: T,
  viewData?: ViewDataMap[T],
  options: NavigationOptions = {},
): NavigationResult {
  if (!canNavigate()) {
    return {
      success: false,
      error: `Cannot navigate from ${currentState.currentView} to ${targetView}`,
    };
  }

  const nextState: RouterState = {
    currentView: targetView,
    history: nextHistory(currentState, options.history ?? 'push'),
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
 * Builds the history that results from leaving the current view under the given mode
 */
function nextHistory(currentState: RouterState, mode: HistoryMode): HistoryEntry[] {
  if (mode === 'reset') return [];
  if (mode === 'replace') return currentState.history;
  const entry = {
    view: currentState.currentView,
    data: currentState.viewData[currentState.currentView],
  } as HistoryEntry;
  return [...currentState.history, entry].slice(-ROUTER_HISTORY_LIMIT);
}

/**
 * Index of the most recent history entry for a view, or -1
 */
function findNearestEntry(history: HistoryEntry[], view: ViewType): number {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].view === view) return i;
  }
  return -1;
}

/**
 * Makes a stacked entry the current view again, restoring the data it was left with
 */
function restoreEntry(currentState: RouterState, entry: HistoryEntry, remainingHistory: HistoryEntry[]): RouterState {
  return {
    currentView: entry.view,
    history: remainingHistory,
    viewData: {
      ...currentState.viewData,
      ...(entry.data !== undefined ? { [entry.view]: entry.data } : {}),
    },
  };
}

/**
 * Prepares navigation to the previous view, restoring the data it was left with
 */
export function prepareGoBack(currentState: RouterState): NavigationResult {
  const entry = currentState.history.at(-1);
  if (!entry) {
    return {
      success: false,
      error: 'No previous view to navigate to',
    };
  }

  return {
    success: true,
    nextState: restoreEntry(currentState, entry, currentState.history.slice(0, -1)),
  };
}

/**
 * Prepares an unwind to the nearest occurrence of a view in the history, dropping everything
 * stacked above it. Fails when the view was never navigated from — this never jumps.
 */
export function prepareGoBackTo(currentState: RouterState, targetView: ViewType): NavigationResult {
  const index = findNearestEntry(currentState.history, targetView);
  if (index === -1) {
    return {
      success: false,
      error: `${targetView} is not in the navigation history`,
    };
  }

  return {
    success: true,
    nextState: restoreEntry(currentState, currentState.history[index], currentState.history.slice(0, index)),
  };
}

/**
 * Updates view data without navigating. For a stacked view the nearest snapshot is updated too,
 * so what is set here is what the player finds on returning to it.
 */
export function prepareSetViewData<T extends ViewType>(
  currentState: RouterState,
  view: T,
  data: ViewDataMap[T],
): RouterState {
  const index = view === currentState.currentView ? -1 : findNearestEntry(currentState.history, view);
  const history =
    index === -1
      ? currentState.history
      : currentState.history.map((entry, i) => (i === index ? ({ view, data } as HistoryEntry) : entry));

  return {
    ...currentState,
    history,
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
  return state.history.length > 0;
}

// ============================================================================
// Type-safe navigation functions for each view
// ============================================================================

/**
 * Navigate to town hub with required data
 */
export function goToTownHub(
  currentState: RouterState,
  data: ViewDataMap['town-hub'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'town-hub', data, options);
}

/**
 * Navigate to battle demo with required data
 */
export function goToBattleDemo(
  currentState: RouterState,
  data: ViewDataMap['battle-demo'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'battle-demo', data, options);
}

/**
 * Navigate to a dungeon run with required data
 */
export function goToDungeon(
  currentState: RouterState,
  data: ViewDataMap['dungeon'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'dungeon', data, options);
}

/**
 * Navigate to a map. `data.mapId` selects which one — every map shares this view.
 */
export function goToMap(
  currentState: RouterState,
  data: ViewDataMap['map'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'map', data, options);
}

/**
 * Navigate to dialogue demo
 */
export function goToDialogueDemo(
  currentState: RouterState,
  data?: ViewDataMap['dialogue-demo'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'dialogue-demo', data ?? {}, options);
}

/**
 * Navigate to debug view
 */
export function goToDebug(
  currentState: RouterState,
  data?: ViewDataMap['debug'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'debug', data ?? {}, options);
}

/**
 * Navigate to battle rewards.
 * Launched from a battle, the rewards replace it in the history so `goBack()` returns to the view
 * that started the fight (map, dungeon, town) instead of the finished battle. Launched from
 * anywhere else (the debug demo) it is an ordinary navigation back to the launching view.
 */
export function goToBattleRewards(
  currentState: RouterState,
  data: ViewDataMap['battle-rewards'],
  options?: NavigationOptions,
): NavigationResult {
  const isFromBattle = currentState.currentView === 'battle-demo';
  return prepareNavigation(currentState, 'battle-rewards', data, {
    ...options,
    history: isFromBattle ? 'replace' : options?.history,
  });
}
