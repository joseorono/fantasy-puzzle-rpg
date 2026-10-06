import type { BaseSlice } from '../../types/store';
import type { GridPosition } from '../../types/geometry';
import type { MapId } from '../../types/map';

/**
 * Map node types
 */
export type MapNodeType = 'Town' | 'Battle' | 'Boss' | 'Dungeon' | 'Treasure' | 'Mystery';

/**
 * Progress tracking for individual nodes
 */
export interface NodeProgress {
  [nodeId: string]: boolean;
}

/**
 * Map progress state structure
 */
export interface MapProgressState {
  battlesCompleted: NodeProgress;
  bossesCompleted: NodeProgress;
  dungeonsCompleted: NodeProgress;
  townsVisited: NodeProgress;
  treasuresFound: NodeProgress;
  mysteriesSolved: NodeProgress;
  /** Where the player stood on each map, so every map resumes at its own spot. */
  characterPositions: Partial<Record<MapId, GridPosition>>;
  /** Roaming enemies (FOEs) beaten for good, by FOE id. */
  foesDefeated: NodeProgress;
  /** The FOE whose battle is in flight; resolved by the rewards screen, cleared by the map on mount. */
  pendingFoeBattleId: string | null;
}

/**
 * Map progress slice actions
 */
export interface MapProgressActions {
  completeNode: (nodeType: MapNodeType, nodeId: string) => void;
  isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => boolean;
  resetProgress: () => void;
  setCharacterPosition: (mapId: MapId, position: GridPosition) => void;
  /** Retire a FOE for good. */
  markFoeDefeated: (foeId: string) => void;
  /** Remember (or forget, with `null`) which FOE's battle is about to start. */
  setPendingFoeBattle: (foeId: string | null) => void;
  /** Mark the pending FOE defeated and clear it; a no-op when nothing is pending. */
  resolvePendingFoeBattle: () => void;
}

/**
 * Complete map progress slice interface
 */
export interface MapProgressSlice extends BaseSlice {
  mapProgress: MapProgressState;
  actions: {
    mapProgress: MapProgressActions;
  };
}
