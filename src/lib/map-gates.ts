import type { GridPosition } from '~/types/geometry';
import type { InteractiveMapNode } from '~/types/map-node';
import { isMaskWalkable, type WalkableMask } from '~/lib/tilemap-collision';
import { getNodePositions } from '~/lib/map-content';

/**
 * Every tile held by an unbeaten gate: a node that `blocksMovement` and isn't completed yet.
 *
 * @param nodes The map's nodes.
 * @param isCompleted Completion lookup for a node.
 */
export function getUnbeatenGateTiles(
  nodes: InteractiveMapNode[] | undefined,
  isCompleted: (node: InteractiveMapNode) => boolean,
): GridPosition[] {
  return (nodes ?? []).filter((node) => node.blocksMovement && !isCompleted(node)).flatMap(getNodePositions);
}

/**
 * Floods the walkable tiles reachable from the origins without crossing an unbeaten gate.
 * A gate can be stepped onto from the open side, but whatever lies past it stays sealed —
 * so no one wanders into a fight by accident, and no one slips by one either.
 *
 * @param mask Ground walkability.
 * @param gateTiles Tiles of unbeaten gates; the flood treats them as walls.
 * @param origins Where the player legitimately is: the map's spawn, and where this visit began.
 *   An origin on a gate tile or off the ground is skipped.
 * @returns One byte per tile, row-major: 1 = open.
 */
export function floodOpenTiles(
  mask: WalkableMask,
  gateTiles: readonly GridPosition[],
  origins: readonly GridPosition[],
): Uint8Array {
  const { width, height } = mask;
  const open = new Uint8Array(width * height);
  const isGate = new Uint8Array(width * height);
  for (const { row, col } of gateTiles) {
    if (row >= 0 && row < height && col >= 0 && col < width) isGate[row * width + col] = 1;
  }

  const queue: number[] = [];
  const visit = (row: number, col: number) => {
    if (!isMaskWalkable(mask, row, col)) return;
    const index = row * width + col;
    if (open[index] || isGate[index]) return;
    open[index] = 1;
    queue.push(index);
  };

  for (const { row, col } of origins) visit(row, col);
  for (let head = 0; head < queue.length; head++) {
    const row = Math.floor(queue[head] / width);
    const col = queue[head] % width;
    visit(row - 1, col);
    visit(row + 1, col);
    visit(row, col - 1);
    visit(row, col + 1);
  }

  return open;
}

/**
 * Whether the player may occupy a tile: open ground, or an unbeaten gate itself (stepping on
 * one is how it's challenged). Sealed ground past a gate is refused.
 *
 * @param mask Ground walkability.
 * @param open From {@link floodOpenTiles}, or `null` when the map has no unbeaten gates.
 * @param isGateTile Whether the tile holds an unbeaten gate.
 * @param row Grid row.
 * @param col Grid column.
 */
export function canPlayerOccupy(
  mask: WalkableMask,
  open: Uint8Array | null,
  isGateTile: boolean,
  row: number,
  col: number,
): boolean {
  if (!isMaskWalkable(mask, row, col)) return false;
  if (open === null || isGateTile) return true;
  return open[row * mask.width + col] === 1;
}
