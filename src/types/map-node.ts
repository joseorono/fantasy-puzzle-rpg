import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { EnemyData } from './rpg-elements';
import type { Resources } from './resources';
import type { LootTable } from './loot';
import type { DungeonDefinition } from './dungeon';
import type { MapId } from './map';
import type { GridPosition } from './geometry';

// ─── General Map Types ────────────────────────────────────────────────

// Valid sublocations of any town
export type townLocations = 'town-hub' | 'blacksmith' | 'inn' | 'item-store' | 'training-grounds';

// ─── Interactive Map Nodes ────────────────────────────────────────────

/**
 * Interactive map node definition
 */
export interface InteractiveMapNode {
  /** Unique identifier for this node */
  id: string;
  /** Type of node */
  type: MapNodeType;
  /** Position on the map grid; several tiles place copies that share this node's id and progress */
  position: GridPosition | GridPosition[];
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
  /** Where a NextMap / PreviousMap node leads */
  destination?: MapDestination;
}

/**
 * The far end of a map exit. `arrival` should sit beside the paired exit node, not on it,
 * so its menu doesn't pop open the moment the player lands.
 */
export interface MapDestination {
  mapId: MapId;
  arrival: GridPosition;
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
  position: GridPosition;
  /** Maximum values for random resource generation */
  maxValues: Resources;
  /** Whether this loot has been collected (runtime state, not persisted here) */
  isCollected?: boolean;
}
