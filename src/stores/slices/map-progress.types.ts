import type { BaseSlice } from '../../types/store';

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
}

/**
 * Map progress slice actions
 */
export interface MapProgressActions {
  completeNode: (nodeType: MapNodeType, nodeId: string) => void;
  isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => boolean;
  resetProgress: () => void;
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

