import type { BaseSlice } from '../../types/store';
import type { GridPosition } from '../../types/geometry';
import type { MapId } from '../../types/map';

/**
 * Map node types
 */
export type MapNodeType = 'Town' | 'Battle' | 'Boss' | 'Dungeon' | 'Treasure' | 'Mystery' | 'NextMap' | 'PreviousMap';

/**
 * Progress tracking for individual nodes
 */
export interface NodeProgress {
  [nodeId: string]: boolean;
}

/** A map node whose battle is in flight. */
export interface PendingNodeBattle {
  nodeType: MapNodeType;
  nodeId: string;
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
  /** Next Map / Previous Map nodes travelled through. */
  exitsUsed: NodeProgress;
  /** Dialogue trigger events already played, by `getDialogueTriggerSeenKey`. */
  dialogueTriggersSeen: NodeProgress;
  /** Where the player stood on each map, so every map resumes at its own spot. */
  characterPositions: Partial<Record<MapId, GridPosition>>;
  /** Roaming enemies (FOEs) beaten for good, by FOE id. */
  foesDefeated: NodeProgress;
  /** The FOE whose battle is in flight; resolved by the rewards screen, cleared by the map on mount. */
  pendingFoeBattleId: string | null;
  /** The node whose battle is in flight; completed by the rewards screen, cleared by the map on mount. */
  pendingNodeBattle: PendingNodeBattle | null;
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
  /** Remember that a dialogue trigger event played, so it never fires again. */
  markDialogueTriggerSeen: (key: string) => void;
  /** Remember (or forget, with `null`) which FOE's battle is about to start. */
  setPendingFoeBattle: (foeId: string | null) => void;
  /** Remember (or forget, with `null`) which node's battle is about to start. */
  setPendingNodeBattle: (battle: PendingNodeBattle | null) => void;
  /** The pending battle was won: retire its FOE or complete its node, then clear both. */
  resolvePendingBattle: () => void;
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
