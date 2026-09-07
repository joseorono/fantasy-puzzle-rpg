import type { LootTable } from './loot';
import type { DungeonDefinition } from './dungeon';
import type { MapId } from './map';

/**
 * Available views in the game
 */
export type ViewType =
  | 'town-hub'
  | 'battle-demo'
  | 'map'
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
 * Data for the dungeon view. The full dungeon object is passed by reference (authored
 * dungeons are module constants; generated/randomized ones are one-off objects), so a run
 * needs no registry lookup and future multi-dungeon locations can hand off any definition.
 * `isReplay` is computed at entry from completion state.
 */
export interface DungeonViewData {
  dungeon: DungeonDefinition;
  isReplay: boolean;
  /**
   * Surface to return to when the run ends, finished or abandoned. Captured automatically by
   * `goToDungeon` from the launching view; callers may override it. Needed because a run's
   * battle round-trip (dungeon → battle → rewards → goBack) lands back on the dungeon with
   * `previousView` cleared, so `goBack()` on the way out would no-op.
   */
  returnView?: ViewType;
}

/**
 * Data for the map view. `mapId` selects the definition from `MAP_REGISTRY`, so every map
 * shares this one view rather than each getting its own.
 *
 * `returnView` works exactly like `DungeonViewData.returnView`: a battle round-trip
 * (map → battle → rewards → goBack) lands back on the map with `previousView` cleared, so
 * the map keeps its own record of where it was entered from. Without it the way out
 * disappears the first time you fight something.
 */
export interface MapViewData {
  mapId: MapId;
  returnView?: ViewType;
}

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
  /** Battle-rating loot bonus already applied to the resources (for the "×N LOOT" badge). */
  lootMultiplier?: number;
}

/**
 * View data mapping
 */
export interface ViewDataMap {
  'town-hub': TownHubViewData;
  'battle-demo': BattleViewData;
  map: MapViewData;
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
  MapViewData &
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
