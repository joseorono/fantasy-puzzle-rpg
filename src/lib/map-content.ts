import type { InteractiveMapNode, FloorLootSpot } from '~/types/map-node';
import type { DialogueTrigger } from '~/types/map';

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
