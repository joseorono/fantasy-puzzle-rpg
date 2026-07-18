import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { EnemyData } from './rpg-elements';
import type { Resources } from './resources';
import type { LootTable } from './loot';
import type { DungeonDefinition } from './dungeon';

// ─── General Map Types ────────────────────────────────────────────────

// Valid sublocations of any town
export type townLocations = 'town-hub' | 'blacksmith' | 'inn' | 'item-store' | 'skill-trainer';

// ─── Interactive Map Nodes ────────────────────────────────────────────

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
  /** Loot payload for Treasure nodes */
  lootPayload?: LootTable;
  /** Dungeon registry id (`DungeonDefinition.id`) this Dungeon node enters — resolved via the `DUNGEONS` registry */
  dungeonId?: string;
  /** Inline dungeon definition for a Dungeon node — takes precedence over `dungeonId` when both are set */
  dungeon?: DungeonDefinition;
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

// ─── Encounters ───────────────────────────────────────────────────────

/**
 * Defines the enemy composition for a single encounter on a map node.
 */
export interface EncounterDefinition {
  enemies: EnemyData[];
}

// ─── Floor Loot ───────────────────────────────────────────────────────

/**
 * Floor loot spot definition for scattered collectible resources on the map
 */
export interface FloorLootSpot {
  /** Unique identifier for this floor loot spot */
  id: string;
  /** Position on the map grid */
  position: {
    row: number;
    col: number;
  };
  /** Maximum values for random resource generation */
  maxValues: Resources;
  /** Whether this loot has been collected (runtime state, not persisted here) */
  isCollected?: boolean;
}

