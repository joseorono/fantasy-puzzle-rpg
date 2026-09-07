/**
 * Rendering constants for the tile-map's interactive node markers.
 * Sizes are in map pixels (pre-scale), the same space the canvas draws tiles in.
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
