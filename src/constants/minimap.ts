/*
 * Map overview (Tab). The walkable region is traced into smooth ink contours and drawn as
 * one SVG path on a parchment sheet docked beside the character. Colours live in
 * src/styles/map-minimap.css.
 */

/** How much path corners are rounded: 0 keeps the tile steps, 1 smooths them fully. */
export const MINIMAP_CORNER_ROUNDING = 1;

/** Hand-drawn wobble of the ink, in tiles. 0 draws clean lines and renders no filter. */
export const MINIMAP_INK_WOBBLE_TILES = 0.18;

/** Smallest screen pixels per tile. Below this the sheet stops docking and goes centre-stage. */
export const MINIMAP_MIN_PX_PER_TILE = 2;

/** Largest screen pixels per tile, so small maps don't fill the window. */
export const MINIMAP_MAX_PX_PER_TILE = 10;

/** Share of the window width a docked sheet may use. */
export const MINIMAP_DOCK_WIDTH_FRACTION = 0.5;

/** Window width reserved for the sheet's padding and its distance from the window edge. */
export const MINIMAP_CHROME_WIDTH_PX = 96;

/** Window height reserved for the title banner, legend, key hint and padding. */
export const MINIMAP_CHROME_HEIGHT_PX = 220;
