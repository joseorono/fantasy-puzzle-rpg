
/*
 * Tile-map camera. Distances are in map pixels, the space tiles are authored in;
 * `zoom` is applied only when drawing.
 */

/** Integer display scale used when a map config omits `zoom`. 1 = tiles at native pixel size. */
export const MAP_DEFAULT_ZOOM = 1;

 */

/**
 * Edge length of a node marker square. Larger than a 16px tile, so markers are drawn
 * centered on their tile rather than top-left aligned.
 */
export const MAP_NODE_MARKER_SIZE = 32;

/** Icon glyph size, as a fraction of the marker — keeps the glyph scaling with the box. */
export const MAP_NODE_ICON_RATIO = 0.75;

/** Completion checkmark glyph size, as a fraction of the marker. */
export const MAP_NODE_CHECK_RATIO = 0.625;

/** Inset of the checkmark from the marker's top-right corner, as a fraction of the marker. */
export const MAP_NODE_CHECK_INSET_RATIO = 0.25;
