import type { InteractiveMapNode, FloorLootSpot } from '~/types/map-node';
import type { DialogueTrigger } from '~/types/map';
import type { MapNodeType, MapProgressState } from '~/stores/slices/map-progress.types';

/**
 * Finds the interactive node occupying a tile.
 *
 * @param nodes The owning map's nodes; omit or pass an empty array for a map with none.
 * @param row Grid row (Y).
 * @param col Grid column (X).
 * @returns The node at that tile, or `undefined`.
 */
export function findNodeAt(
  nodes: InteractiveMapNode[] | undefined,
  row: number,
  col: number,
): InteractiveMapNode | undefined {
  return nodes?.find((node) => node.position.row === row && node.position.col === col);
}

/**
 * Finds the floor loot spot on a tile.
 *
 * @param spots The owning map's floor loot spots.
 * @param row Grid row (Y).
 * @param col Grid column (X).
 * @returns The loot spot at that tile, or `undefined`.
 */
export function findFloorLootAt(
  spots: FloorLootSpot[] | undefined,
  row: number,
  col: number,
): FloorLootSpot | undefined {
  return spots?.find((spot) => spot.position.row === row && spot.position.col === col);
}

/**
 * Finds the dialogue trigger on a tile.
 *
 * @param triggers The owning map's dialogue triggers.
 * @param row Grid row (Y).
 * @param col Grid column (X).
 * @returns The trigger at that tile, or `undefined`.
 */
export function findDialogueTriggerAt(
  triggers: DialogueTrigger[] | undefined,
  row: number,
  col: number,
): DialogueTrigger | undefined {
  return triggers?.find((trigger) => trigger.row === row && trigger.col === col);
}

/** Which map progress record tracks completion for each node type. */
const NODE_PROGRESS_KEYS: Record<MapNodeType, Exclude<keyof MapProgressState, 'characterPositions'>> = {
  Battle: 'battlesCompleted',
  Boss: 'bossesCompleted',
  Dungeon: 'dungeonsCompleted',
  Town: 'townsVisited',
  Treasure: 'treasuresFound',
  Mystery: 'mysteriesSolved',
};

/**
 * Whether a node is completed in a map progress snapshot.
 *
 * Takes the state itself rather than reading the store, so a render that calls it
 * recomputes whenever the subscribed progress changes.
 *
 * @param progress Map progress state.
 * @param nodeType The node's type.
 * @param nodeId The node's id.
 */
export function isNodeCompletedInProgress(progress: MapProgressState, nodeType: MapNodeType, nodeId: string): boolean {
  return progress[NODE_PROGRESS_KEYS[nodeType]]?.[nodeId] === true;
}
