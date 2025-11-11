import type { MapNodeType } from '~/stores/slices/map-progress.types';

/**
 * Interactive map node definition
 */
export interface InteractiveMapNode {
  /** Unique identifier for this node */
  id: string;
  /** Type of node */
  type: MapNodeType;
  /** Position on the map grid */
  position: {
    row: number;
    col: number;
  };
  /** Display name for the node */
  name: string;
  /** Optional dialogue scene key to trigger */
  dialogueScene?: string;
  /** Whether this node blocks movement when incomplete */
  blocksMovement: boolean;
  /** Optional description */
  description?: string;
}

/**
 * Action options for interacting with nodes
 */
export type NodeAction = 'fight' | 'enter' | 'view-dialogue' | 'cancel';

/**
 * Node interaction menu state
 */
export interface NodeInteractionState {
  node: InteractiveMapNode;
  isCompleted: boolean;
}

