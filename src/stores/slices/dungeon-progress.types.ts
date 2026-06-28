import type { BaseSlice } from '../../types/store';

/**
 * Persisted dungeon completion flags, keyed by dungeon id. This is the only
 * dungeon state that lives in the Zustand store — run state is transient (Jotai).
 */
export interface DungeonProgressState {
  completedDungeons: Record<string, boolean>;
}

/**
 * Dungeon progress slice actions.
 */
export interface DungeonProgressActions {
  /** Mark a dungeon cleared. The single store write fired per run, on completion. */
  markDungeonCompleted: (dungeonId: string) => void;
  /** Whether a dungeon has been cleared (used to compute `isReplay` at entry). */
  isDungeonCompleted: (dungeonId: string) => boolean;
}

/**
 * Complete dungeon progress slice interface.
 */
export interface DungeonProgressSlice extends BaseSlice {
  dungeonProgress: DungeonProgressState;
  actions: {
    dungeonProgress: DungeonProgressActions;
  };
}
