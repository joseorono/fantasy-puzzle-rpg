import type { GridPosition, Position } from '~/types/geometry';
import type { TilePathfinder, WalkablePredicate } from '~/types/foe';
import { FOE_LOS_CORNER_EPSILON, FOE_PATH_NEIGHBOUR_OFFSETS } from '~/constants/foe';

/**
 * Whether a straight segment stays on walkable tiles the whole way. Every tile the segment
 * touches is checked (a supercover walk), and a segment through an exact grid corner needs
 * both side tiles walkable, so it never squeezes between two diagonal walls.
 *
 * @param from Segment start in tile units (`x` = column, `y` = row; a centre is `+ 0.5`). Its
 *   own tile is not checked.
 * @param to Segment end in tile units.
 * @param isWalkable Walkability of a tile; out-of-bounds must report `false`.
 */
export function hasLineOfSight(from: Position, to: Position, isWalkable: WalkablePredicate): boolean {
  let col = Math.floor(from.x);
  let row = Math.floor(from.y);
  const endCol = Math.floor(to.x);
  const endRow = Math.floor(to.y);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const stepCol = Math.sign(dx);
  const stepRow = Math.sign(dy);
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Number.POSITIVE_INFINITY;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Number.POSITIVE_INFINITY;
  let tMaxX = dx > 0 ? (col + 1 - from.x) * tDeltaX : dx < 0 ? (from.x - col) * tDeltaX : Number.POSITIVE_INFINITY;
  let tMaxY = dy > 0 ? (row + 1 - from.y) * tDeltaY : dy < 0 ? (from.y - row) * tDeltaY : Number.POSITIVE_INFINITY;

  // Bounded by the tile distance, so float drift can never walk past the end tile forever.
  let stepsLeft = Math.abs(endCol - col) + Math.abs(endRow - row);
  while (stepsLeft > 0 && (col !== endCol || row !== endRow)) {
    if (Math.abs(tMaxX - tMaxY) <= FOE_LOS_CORNER_EPSILON) {
      if (!isWalkable(row, col + stepCol) || !isWalkable(row + stepRow, col)) return false;
      col += stepCol;
      row += stepRow;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
      stepsLeft -= 2;
    } else if (tMaxX < tMaxY) {
      col += stepCol;
      tMaxX += tDeltaX;
      stepsLeft--;
    } else {
      row += stepRow;
      tMaxY += tDeltaY;
      stepsLeft--;
    }
    if (!isWalkable(row, col)) return false;
  }
  return true;
}

/**
 * String-pulls a tile path into straight segments: from `start`, skips ahead to the farthest
 * path tile still in line of sight, then repeats from there. The result moves at any angle
 * where the way is clear and still ends on the goal tile.
 *
 * @param start Where the walker stands, in tile units (`x` = column, `y` = row).
 * @param path Tiles to step through, next first (as `findPath` returns them).
 * @param isWalkable Walkability of a tile; out-of-bounds must report `false`.
 * @returns The kept tiles, in order; `[]` for an empty path.
 */
export function smoothPath(start: Position, path: GridPosition[], isWalkable: WalkablePredicate): GridPosition[] {
  const smoothed: GridPosition[] = [];
  let anchor = start;
  let index = 0;
  while (index < path.length) {
    let reach = index;
    while (reach + 1 < path.length && hasLineOfSight(anchor, tileCenterInTiles(path[reach + 1]), isWalkable)) {
      reach++;
    }
    smoothed.push(path[reach]);
    anchor = tileCenterInTiles(path[reach]);
    index = reach + 1;
  }
  return smoothed;
}

function tileCenterInTiles(tile: GridPosition): Position {
  return { x: tile.col + 0.5, y: tile.row + 0.5 };
}

/**
 * Creates a breadth-first pathfinder for a `width × height` tile grid.
 *
 * Uniform step costs make BFS optimal. Its 4-connected tile route is what `smoothPath`
 * then straightens into any-angle segments. The visited set is generation-stamped, so
 * repeated searches don't clear any buffer.
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
      for (const [dRow, dCol] of FOE_PATH_NEIGHBOUR_OFFSETS) {
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
