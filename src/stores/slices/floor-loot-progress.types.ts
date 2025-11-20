import type { BaseSlice } from '~/types/store';

/**
 * Floor loot progress state - tracks which floor loot spots have been collected
 * Key: loot spot ID, Value: true if collected
 */
export interface FloorLootProgress {
  [lootId: string]: boolean;
}

/**
 * Floor loot progress state
 */
export interface FloorLootProgressState {
  /** Map ID to floor loot progress mapping */
  [mapId: string]: FloorLootProgress;
}

/**
 * Floor loot progress slice actions
 */
export interface FloorLootProgressActions {
  /** Mark a floor loot spot as collected */
  collectFloorLoot: (mapId: string, lootId: string) => void;
  /** Check if a floor loot spot has been collected */
  isFloorLootCollected: (mapId: string, lootId: string) => boolean;
  /** Reset all floor loot progress */
  resetFloorLootProgress: () => void;
  /** Reset floor loot progress for a specific map */
  resetMapFloorLootProgress: (mapId: string) => void;
}

/**
 * Complete floor loot progress slice interface
 */
export interface FloorLootProgressSlice extends BaseSlice {
  floorLootProgress: FloorLootProgressState;
  actions: {
    floorLootProgress: FloorLootProgressActions;
  };
}
