export interface Position {
  x: number;
  y: number;
}

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
