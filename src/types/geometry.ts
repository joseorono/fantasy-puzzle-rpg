/**
 * A point in pixels. `x`/`y` always mean pixels; what they're relative to (the window, a map,
 * a sprite sheet) is the caller's to document. For tiles, use {@link GridPosition}.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * A cell on a grid: a map tile or a board slot. Deliberately not `x`/`y`, so a pixel point
 * can never be passed where a tile is expected.
 */
export interface GridPosition {
  row: number;
  col: number;
}

/** An axis-aligned rectangle in pixels, e.g. a sprite's source rect for `drawImage`. */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
