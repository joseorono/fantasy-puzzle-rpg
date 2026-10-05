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

/** Options for {@link buildWalkableMask}. */
export interface WalkableMaskOptions {
  /** Extra layers (floors) acceptable as the visible top surface. Presence enables the visible-surface rule. */
  surfaceLayers?: string[];
  /**
   * GIDs skipped when finding the top visible tile — fully transparent tiles (draw
   * nothing) and overhead structures the player walks under (e.g. arches).
   */
  ignoredGids?: ReadonlySet<number>;
}

/**
 * Tiled packs its flip/rotation flags into the top bits of a GID, including the
 * hex-rotate bit it keeps even on orthogonal maps; clear all four to recover the
 * base id. Matches `TILED_GID_MASK` in `~/lib/map-draw`.
 */
const GID_FLIP_MASK = 0x0fffffff;

/**
 * Flattens the named Tiled layers into a single walkability mask.
 *
 * A tile is walkable when *any* of the given layers has a non-zero tile id
 * there. Built once per map so collision queries — which run per simulation
 * substep, well over a hundred times a second — become a single array read
 * instead of a linear scan over `mapData.layers`.
 *
 * Without `options.surfaceLayers` this is the plain union of `layerNames`. When
 * `surfaceLayers` is set, a region cell is additionally required to have its
 * top-most *visibly drawn* tile belong to `layerNames` or `surfaceLayers`;
 * fully-transparent tiles and overhead structures (`ignoredGids`) are skipped as
 * if absent, and a cell with no drawing layer at all falls back to the plain
 * region result.
 *
 * @param mapData The parsed Tiled map.
 * @param layerNames Names of the layers that mark walkable ground.
 * @param options Visible-surface rule configuration.
 */
export function buildWalkableMask(
  mapData: TilemapData,
  layerNames: string[],
  options: WalkableMaskOptions = {},
): WalkableMask {
  const { width, height } = mapData;
  const data = new Uint8Array(width * height);
  const { surfaceLayers, ignoredGids } = options;

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

  // No surface rule configured: keep the legacy union behavior exactly.
  if (surfaceLayers === undefined) {
    return { data, width, height };
  }

  const allowedTopLayers = new Set([...layerNames, ...surfaceLayers]);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = row * width + col;
      if (data[cell] !== 1) continue;

      let top: string | null = null;
      for (let i = mapData.layers.length - 1; i >= 0; i--) {
        const layer = mapData.layers[i];
        if (row >= layer.height || col >= layer.width) continue;
        const gid = layer.data[row * layer.width + col];
        if (gid === 0) continue;
        if (ignoredGids?.has(gid & GID_FLIP_MASK)) continue;
        top = layer.name;
        break;
      }

      if (top !== null && !allowedTopLayers.has(top)) {
        data[cell] = 0;
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
