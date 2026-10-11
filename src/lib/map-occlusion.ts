import type { TilemapData } from '~/types/tilemap';
import type { MapPixelBox, OcclusionGrid } from '~/types/map-occlusion';
import type { CharacterSpriteMetrics } from '~/lib/character-sprite';
import { decodeTileGid } from '~/lib/map-draw';

/**
 * Finds which cells can cover the character, and the ground row of the object each
 * belongs to, so the renderer can depth-sort them against her feet.
 *
 * A cell occludes when a visible layer in `occlusionLayers` has a tile there, or any
 * visible layer has one of `overheadGids`. Within each layer, occluding tiles are grouped
 * into vertical runs per column, and every cell takes its run's bottom row as its base — a
 * canopy cell inherits the row of the trunk below it. Runs are per layer so a bush on one
 * layer under a canopy on another doesn't drag the tree's ground line down to the bush;
 * where layers overlap, the cell keeps the southernmost base.
 *
 * @param mapData The Tiled map.
 * @param visibleLayers Layers that are drawn; hidden layers never occlude.
 * @param occlusionLayers Layers whose every tile occludes.
 * @param overheadGids Base GIDs (flip bits ignored) that occlude on any layer.
 * @returns The grid; `occludingCellCount` is 0 when nothing is configured.
 */
export function buildOcclusionGrid(
  mapData: TilemapData,
  visibleLayers: readonly string[],
  occlusionLayers: readonly string[],
  overheadGids: readonly number[],
): OcclusionGrid {
  const { width, height } = mapData;
  const baseRows = new Int16Array(width * height).fill(-1);
  const startLayers = new Int16Array(width * height).fill(-1);
  const grid: OcclusionGrid = { width, height, baseRows, startLayers, occludingCellCount: 0 };
  if (occlusionLayers.length === 0 && overheadGids.length === 0) return grid;

  const overhead = new Set(overheadGids);

  // Layers are walked bottom-up, so the first layer recorded at a cell is its lowest occluder.
  mapData.layers.forEach((layer, layerIndex) => {
    if (!visibleLayers.includes(layer.name)) return;
    const isOccludingLayer = occlusionLayers.includes(layer.name);
    if (!isOccludingLayer && overhead.size === 0) return;

    const rows = Math.min(layer.height, height);
    const cols = Math.min(layer.width, width);
    const occludesAt = (row: number, col: number): boolean => {
      const rawGid = layer.data[row * layer.width + col];
      if (rawGid === 0) return false;
      return isOccludingLayer || overhead.has(decodeTileGid(rawGid).gid);
    };

    for (let col = 0; col < cols; col++) {
      let row = 0;
      while (row < rows) {
        if (!occludesAt(row, col)) {
          row++;
          continue;
        }
        const runStart = row;
        while (row < rows && occludesAt(row, col)) row++;
        const baseRow = row - 1;

        for (let runRow = runStart; runRow <= baseRow; runRow++) {
          const cell = runRow * width + col;
          if (startLayers[cell] === -1) {
            startLayers[cell] = layerIndex;
            grid.occludingCellCount++;
          }
          if (baseRow > baseRows[cell]) baseRows[cell] = baseRow;
        }
      }
    }
  });

  return grid;
}

/**
 * Writes the character's on-map sprite frame into `out`, in map pixels. The frame is a
 * little wider than her body, which only adds cells whose redraw changes nothing.
 *
 * @param x Collision point, in map pixels.
 * @param y Collision point, in map pixels.
 * @param metrics From `getCharacterSpriteMetrics` with a display scale of 1, so every size is in map pixels.
 * @param out Reused box, overwritten and returned.
 */
export function getCharacterOcclusionBox(
  x: number,
  y: number,
  metrics: CharacterSpriteMetrics,
  out: MapPixelBox,
): MapPixelBox {
  const frameBottom = y + metrics.footOffsetPx + metrics.baselinePadPx;
  const halfFrame = metrics.frameSizePx / 2;
  out.left = x - halfFrame;
  out.right = x + halfFrame;
  out.top = frameBottom - metrics.frameSizePx;
  out.bottom = frameBottom;
  return out;
}

/**
 * Collects the occluding cells under `box` whose object stands on or below the
 * character's row — the cells that must be redrawn over her.
 *
 * @param grid From {@link buildOcclusionGrid}.
 * @param tileSize Edge length of one tile in map pixels.
 * @param box From {@link getCharacterOcclusionBox}.
 * @param feetRow The tile row of the character's collision point.
 * @param out Reused array; the first `count` entries are the cell indices.
 * @returns How many cells were written to `out`.
 */
export function collectOccludingCells(
  grid: OcclusionGrid,
  tileSize: number,
  box: MapPixelBox,
  feetRow: number,
  out: number[],
): number {
  if (grid.occludingCellCount === 0) return 0;

  const firstCol = Math.max(0, Math.floor(box.left / tileSize));
  const lastCol = Math.min(grid.width - 1, Math.ceil(box.right / tileSize) - 1);
  const firstRow = Math.max(0, Math.floor(box.top / tileSize));
  const lastRow = Math.min(grid.height - 1, Math.ceil(box.bottom / tileSize) - 1);

  let count = 0;
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      const cell = row * grid.width + col;
      const baseRow = grid.baseRows[cell];
      if (baseRow !== -1 && baseRow >= feetRow) out[count++] = cell;
    }
  }
  return count;
}
