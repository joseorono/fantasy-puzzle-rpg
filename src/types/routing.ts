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
  | 'level-up-demo';

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
 * Data for level up view
 */
export interface LevelUpViewData {
  characterId: string;
}

/**
 * Data for inventory view
 */
export interface InventoryViewData {
  // No specific data needed for now
}

/**
 * Data for level up demo view
 */
export interface LevelUpDemoViewData {
  id: string;
}

/**
 * Data for debug view
 */
export interface DebugViewData {
  // No specific data needed
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
  'level-up-demo': LevelUpDemoViewData;
  inventory: InventoryViewData;
  debug: DebugViewData;
}

/**
 * Combined type for all view data (intersection type)
 */
export type RouteStatus = TownHubViewData &
  BattleViewData &
  MapDemoViewData &
  DialogueDemoViewData &
  LevelUpViewData &
  LevelUpDemoViewData &
  InventoryViewData &
  DebugViewData;

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
