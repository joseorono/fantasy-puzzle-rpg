/*
 * Map overview (Tab). The image is one pixel per tile, drawn from the walkable mask as
 * ink on parchment, then shown at an integer scale.
 */

/** An sRGB colour as `[red, green, blue]`, 0–255. */
export type MinimapRgb = readonly [number, number, number];

/** Blank parchment. */
export const MINIMAP_PARCHMENT_RGB: MinimapRgb = [227, 207, 161];

/** Walkable tiles: a soft ink wash. */
export const MINIMAP_PATH_RGB: MinimapRgb = [168, 123, 79];

/** Blocked tiles touching a path: the ink outline that gives paths their shape. */
export const MINIMAP_EDGE_RGB: MinimapRgb = [92, 58, 30];

/** What the parchment darkens toward at the map's border, like an old, handled sheet. */
export const MINIMAP_AGED_EDGE_RGB: MinimapRgb = [184, 149, 106];

/** How far in from the border the ageing reaches, in tiles. */
export const MINIMAP_AGED_EDGE_TILES = 4;

/** Largest per-tile brightness jitter on blank parchment, so it reads as paper rather than a flat fill. */
export const MINIMAP_GRAIN = 6;

/** Smallest screen pixels per tile, even if the map then overflows a small window. */
export const MINIMAP_MIN_SCALE = 2;

/** Largest screen pixels per tile, so small maps don't turn into giant blocks. */
export const MINIMAP_MAX_SCALE = 8;

/** Window width reserved for the panel's frame and padding around the map image. */
export const MINIMAP_CHROME_WIDTH_PX = 160;

/** Window height reserved for the panel's header, legend, key hint and padding. */
export const MINIMAP_CHROME_HEIGHT_PX = 300;
