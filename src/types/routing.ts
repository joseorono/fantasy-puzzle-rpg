import type { LootTable } from './loot';
import type { DungeonDefinition } from './dungeon';
import type { MapId } from './map';
import type { townLocations } from './map-node';

/**
 * Available views in the game
 */
export type ViewType = 'town-hub' | 'battle-demo' | 'map' | 'dialogue-demo' | 'debug' | 'battle-rewards' | 'dungeon';

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
  /**
   * Sub-location to open on the next hub mount instead of the signpost — consumed once by
   * `TownHub`, so a later visit from the map starts at the signpost again. Set by a location
   * that sends the player on a round-trip (the Training Grounds' sparring fight).
   */
  initialLocation?: Exclude<townLocations, 'town-hub'>;
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
}

/**
 * Data for the map view. `mapId` selects the definition from `MAP_REGISTRY`, so every map
 * shares this one view rather than each getting its own.
 */
export interface MapViewData {
  mapId: MapId;
}

/**
 * Data for dialogue demo view (no specific data needed for demo)
 */
export type DialogueDemoViewData = object;

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
  DebugViewData &
  BattleRewardsViewData &
  DungeonViewData;

/**
 * What a navigation does with the view being left.
 * - `push` (default): the current view and its data are stacked so `goBack()` returns to it.
 * - `replace`: the current view is dropped; the stack is untouched. Used when a view stands in
 *   for the one it replaces (battle rewards after the battle that produced them).
 * - `reset`: the stack is emptied. Used when a flow starts a fresh timeline (loading a save).
 */
export type HistoryMode = 'push' | 'replace' | 'reset';

/**
 * Optional second argument of every `goToX` action
 */
export interface NavigationOptions {
  history?: HistoryMode;
}

/**
 * A stacked view together with the data it had when the player left it, so `goBack()` can
 * restore the view exactly. Discriminated on `view`.
 */
export type HistoryEntry = { [V in ViewType]: { view: V; data?: ViewDataMap[V] } }[ViewType];

/**
 * Router state
 */
export interface RouterState {
  currentView: ViewType;
  /** Views to return to, oldest first. `goBack()` pops the last one and restores its data. */
  history: HistoryEntry[];
  /** Live data per view: what the current view renders, plus the last-known data of the rest. */
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
