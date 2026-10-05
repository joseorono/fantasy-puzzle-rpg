import type { GridPosition } from '~/types/geometry';

/** Whether a tile may be walked on. Out-of-bounds tiles must report `false`. */
export type WalkablePredicate = (row: number, col: number) => boolean;

/** A grid path search with its scratch buffers allocated once per map. */
export interface TilePathfinder {
  /**
   * Shortest 4-connected path from `from` to `to`.
   *
   * @param from Start tile; it is not included in the result and need not be walkable.
   * @param to Goal tile; it is the last element of the result.
   * @param isWalkable Walkability of every tile other than `from`.
   * @param nodeBudget Most cells the search may expand before giving up.
   * @returns The tiles to step through, `[]` when already there, or `null` when the goal
   *   is unreachable or the budget ran out.
   */
  findPath(
    from: GridPosition,
    to: GridPosition,
    isWalkable: WalkablePredicate,
    nodeBudget?: number,
  ): GridPosition[] | null;
}

/** Row and column offsets of the four edge neighbours. */
const NEIGHBOUR_OFFSETS: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Creates a breadth-first pathfinder for a `width × height` tile grid.
 *
 * Uniform step costs make BFS optimal, and 4-connectivity matches the player's
 * axis-separated collision, so a path never cuts a corner the player couldn't. The
 * visited set is generation-stamped, so repeated searches don't clear any buffer.
 *
 * @param width Map width in tiles.
 * @param height Map height in tiles.
 */
export function createTilePathfinder(width: number, height: number): TilePathfinder {
  const cellCount = width * height;
  const parents = new Int32Array(cellCount);
  const visited = new Uint32Array(cellCount);
  const queue = new Int32Array(cellCount);
  let generation = 0;

  function inBounds(row: number, col: number): boolean {
    return row >= 0 && row < height && col >= 0 && col < width;
  }

  function reconstruct(goal: number, start: number): GridPosition[] {
    const path: GridPosition[] = [];
    for (let cell = goal; cell !== start; cell = parents[cell]) {
      path.push({ row: (cell / width) | 0, col: cell % width });
    }
    return path.reverse();
  }

  function findPath(
    from: GridPosition,
    to: GridPosition,
    isWalkable: WalkablePredicate,
    nodeBudget = Number.POSITIVE_INFINITY,
  ): GridPosition[] | null {
    if (from.row === to.row && from.col === to.col) return [];
    if (!inBounds(from.row, from.col) || !inBounds(to.row, to.col)) return null;
    if (!isWalkable(to.row, to.col)) return null;

    generation++;
    if (generation === 0xffffffff) {
      visited.fill(0);
      generation = 1;
    }

    const start = from.row * width + from.col;
    const goal = to.row * width + to.col;
    let head = 0;
    let tail = 0;
    let expanded = 0;

    visited[start] = generation;
    parents[start] = -1;
    queue[tail++] = start;

    while (head < tail) {
      const cell = queue[head++];
      if (cell === goal) return reconstruct(goal, start);
      if (++expanded > nodeBudget) return null;

      const row = (cell / width) | 0;
      const col = cell % width;
      for (const [dRow, dCol] of NEIGHBOUR_OFFSETS) {
        const nextRow = row + dRow;
        const nextCol = col + dCol;
        if (!inBounds(nextRow, nextCol)) continue;
        const next = nextRow * width + nextCol;
        if (visited[next] === generation || !isWalkable(nextRow, nextCol)) continue;
        visited[next] = generation;
        parents[next] = cell;
        queue[tail++] = next;
      }
    }

    return null;
  }

  return { findPath };
}
