import type { RouterState, ViewType, TownHubViewData } from '~/types/routing';
import { ConsumableItemIds } from '~/constants/inventory';

/**
 * Default view on game start
 */
export const DEFAULT_VIEW: ViewType = 'debug';

/**
 * Most entries the navigation history keeps; the oldest are dropped past this. A safety net
 * against a flow that keeps pushing instead of going back — real flows are three deep at most.
 */
export const ROUTER_HISTORY_LIMIT = 16;

/**
 * Default town hub data
 */
export const DEFAULT_TOWN_HUB_DATA: TownHubViewData = {
  townName: 'Town',
  innCost: {
    coins: 10,
    gold: 0,
    silver: 0,
    iron: 0,
    copper: 0,
  },
  itemsForSell: [...ConsumableItemIds],
  onLeaveCallback: () => {},
};

/**
 * Initial router state
 */
export const INITIAL_ROUTER_STATE: RouterState = {
  currentView: DEFAULT_VIEW,
  history: [],
  viewData: {
    debug: {},
    'town-hub': DEFAULT_TOWN_HUB_DATA,
  },
};
