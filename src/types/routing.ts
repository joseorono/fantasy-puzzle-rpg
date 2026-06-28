import type { LootTable } from './loot';

/**
 * Available views in the game
 */
export type ViewType =
  | 'town-hub'
  | 'battle-demo'
  | 'map-demo'
  | 'map-demo-2'
  | 'dialogue-demo'
  | 'inventory'
  | 'debug'
  | 'battle-rewards'
  | 'dungeon';

/**
 * Data for town hub view
 */
export interface TownHubViewData {
  townName: string;
  innCost: {
    coins: number;
    gold: number;
    silver: number;
    iron: number;
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
  /** Background image URL for the battle panels; falls back to the default art. */
  bgImage?: string;
}

/**
 * Data for the dungeon view. `isReplay` is computed at entry from completion state.
 */
export interface DungeonViewData {
  dungeonId: string;
  isReplay: boolean;
}

/**
 * Data for map demo view (no specific data needed for demo)
 */
export type MapDemoViewData = object;

/**
 * Data for map demo 2 view (no specific data needed for demo)
 */
export type MapDemo2ViewData = object;

/**
 * Data for dialogue demo view (no specific data needed for demo)
 */
export type DialogueDemoViewData = object;

/**
 * Data for inventory view (no specific data needed for now)
 */
export type InventoryViewData = object;

/**
 * Data for debug view (no specific data needed)
 */
export type DebugViewData = object;

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
  'map-demo-2': MapDemo2ViewData;
  'dialogue-demo': DialogueDemoViewData;
  inventory: InventoryViewData;
  debug: DebugViewData;
  'battle-rewards': BattleRewardsViewData;
  dungeon: DungeonViewData;
}

/**
 * Combined type for all view data (intersection type)
 */
export type RouteStatus = TownHubViewData &
  BattleViewData &
  MapDemoViewData &
  MapDemo2ViewData &
  DialogueDemoViewData &
  InventoryViewData &
  DebugViewData &
  BattleRewardsViewData &
  DungeonViewData;

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
