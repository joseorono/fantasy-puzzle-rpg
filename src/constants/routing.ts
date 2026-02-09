import type { RouterState, ViewType, TownHubViewData } from '~/types/routing';
import { ConsumableItemIds } from '~/constants/inventory';

/**
 * Default view on game start
 */
export const DEFAULT_VIEW: ViewType = 'debug';

/**
 * Default town hub data
 */
export const DEFAULT_TOWN_HUB_DATA: TownHubViewData = {
  innCost: {
    coins: 10,
    gold: 0,
    silver: 0,
    bronze: 0,
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
  previousView: null,
  viewData: {
    debug: {},
    'town-hub': DEFAULT_TOWN_HUB_DATA,
  },
};
