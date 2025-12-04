import type { LootTable } from './loot';

/**
 * Available views in the game
 */
export type ViewType =
  | 'town-hub'
  | 'battle-demo'
  | 'map-demo'
  | 'dialogue-demo'
  | 'level-up'
  | 'inventory'
  | 'debug'
  | 'battle-rewards';

/**
 * Data for town hub view
 */
export interface TownHubViewData {
  innCost: {
    coins: number;
    gold: number;
    silver: number;
    bronze: number;
    copper: number;
  };
  itemsForSell: string[];
  onLeaveCallback: () => void;
}

/**
 * Data for battle view
 */
export interface BattleViewData {
  enemyId: string;
  location?: string;
  canFlee?: boolean;
}

/**
 * Data for map demo view
 */
export interface MapDemoViewData {
  // No specific data needed for demo
}

/**
 * Data for dialogue demo view
 */
export interface DialogueDemoViewData {
  // No specific data needed for demo
}

/**
 * Data for inventory view
 */
export interface InventoryViewData {
  // No specific data needed for now
}

/**
 * Data for level up view
 */
export interface LevelUpViewData {
  id: string;
}

/**
 * Data for debug view
 */
export interface DebugViewData {
  // No specific data needed
}

/**
 * Data for battle rewards view
 */
export interface BattleRewardsViewData {
  lootTable: LootTable;
  expReward: number;
}

/**
 * View data mapping
 */
export interface ViewDataMap {
  'town-hub': TownHubViewData;
  'battle-demo': BattleViewData;
  'map-demo': MapDemoViewData;
  'dialogue-demo': DialogueDemoViewData;
  'level-up': LevelUpViewData;
  inventory: InventoryViewData;
  debug: DebugViewData;
  'battle-rewards': BattleRewardsViewData;
}

/**
 * Combined type for all view data (intersection type)
 */
export type RouteStatus = TownHubViewData &
  BattleViewData &
  MapDemoViewData &
  DialogueDemoViewData &
  LevelUpViewData &
  InventoryViewData &
  DebugViewData &
  BattleRewardsViewData;

/**
 * Router state
 */
export interface RouterState {
  currentView: ViewType;
  previousView: ViewType | null;
  viewData: Partial<ViewDataMap>;
}

/**
 * Navigation result from pure functions
 */
export interface NavigationResult {
  success: boolean;
  error?: string;
  nextState?: RouterState;
}
