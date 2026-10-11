/** Per-cell occlusion data for one map, built once by `buildOcclusionGrid`. */
export interface OcclusionGrid {
  /** Map width in tiles. */
  width: number;
  /** Map height in tiles. */
  height: number;
  /**
   * Bottom row of the vertical run of occluding tiles each cell belongs to — the object's
   * ground line. Runs are per layer; overlapping layers keep the southernmost. -1 where
   * nothing occludes.
   */
  baseRows: Int16Array;
  /**
   * Index into `mapData.layers` of the lowest occluding tile at each cell; every visible
   * layer from it upward is redrawn over the character. -1 where nothing occludes.
   */
  startLayers: Int16Array;
  /** Number of occluding cells. 0 means the map needs no occlusion pass at all. */
  occludingCellCount: number;
}

/** An axis-aligned box in map pixels: `left`/`top` inclusive, `right`/`bottom` exclusive. */
export interface MapPixelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
