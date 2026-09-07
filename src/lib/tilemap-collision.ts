import type { TilemapData } from '~/types/tilemap';

/** A precomputed per-tile walkability lookup for one map. */
export interface WalkableMask {
  /** One byte per tile, row-major: 1 = walkable, 0 = blocked. */
  data: Uint8Array;
  /** Map width in tiles. */
  width: number;
  /** Map height in tiles. */
  height: number;
}

/**
 * Flattens the named Tiled layers into a single walkability mask.
 *
 * A tile is walkable when *any* of the given layers has a non-zero tile id
 * there. Built once per map so collision queries — which run per simulation
 * substep, well over a hundred times a second — become a single array read
 * instead of a linear scan over `mapData.layers`.
 *
 * @param mapData The parsed Tiled map.
 * @param layerNames Names of the layers that mark walkable ground.
 */
export function buildWalkableMask(mapData: TilemapData, layerNames: string[]): WalkableMask {
  const { width, height } = mapData;
  const data = new Uint8Array(width * height);

  for (const layerName of layerNames) {
    const layer = mapData.layers.find((candidate) => candidate.name === layerName);
    if (!layer) continue;

    for (let row = 0; row < layer.height; row++) {
      if (row >= height) break;
      for (let col = 0; col < layer.width; col++) {
        if (col >= width) break;
        if (layer.data[row * layer.width + col] !== 0) {
          data[row * width + col] = 1;
        }
      }
    }
  }

  return { data, width, height };
}

/**
 * Reads the mask at (row, col), treating out-of-bounds tiles as blocked.
 * This is what keeps the character inside the map — there is no separate
 * boundary clamp in the movement loop.
 */
export function isMaskWalkable(mask: WalkableMask, row: number, col: number): boolean {
  if (row < 0 || row >= mask.height) return false;
  if (col < 0 || col >= mask.width) return false;
  return mask.data[row * mask.width + col] === 1;
}

/**
 * Finds the first walkable tile in row-major order, used as a spawn fallback
 * when a saved or configured start position is not walkable.
 *
 * @returns The tile, or `null` when the map has no walkable tiles at all.
 */
export function findFirstWalkableTile(mask: WalkableMask): { row: number; col: number } | null {
  for (let row = 0; row < mask.height; row++) {
    for (let col = 0; col < mask.width; col++) {
      if (mask.data[row * mask.width + col] === 1) return { row, col };
    }
  }
  return null;
}
