import type { BaseSlice } from '../../types/store';
import type { GridPosition } from '../../types/geometry';

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
  characterPosition: GridPosition | null;
}

/**
 * Map progress slice actions
 */
export interface MapProgressActions {
  completeNode: (nodeType: MapNodeType, nodeId: string) => void;
  isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => boolean;
  resetProgress: () => void;
  setCharacterPosition: (position: GridPosition) => void;
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

