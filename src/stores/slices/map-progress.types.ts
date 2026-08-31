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
}

/**
 * Map progress slice actions
 */
export interface MapProgressActions {
  completeNode: (nodeType: MapNodeType, nodeId: string) => void;
  isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => boolean;
  resetProgress: () => void;
  setCharacterPosition: (mapId: MapId, position: GridPosition) => void;
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
