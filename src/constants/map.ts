import type { MapNodeType } from '~/stores/slices/map-progress.types';
import type { MapNodeMarkerStyle, MarkerPlatePalette, NodeMarkerState } from '~/types/map';
import type { JirbyColorSymbolName, JirbyWhiteSymbolName } from '~/types/jirby-symbols';
import type { PixelRect } from '~/types/geometry';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';

/*
 * Tile-map camera. Distances are in map pixels, the space tiles are authored in;
 * `zoom` is applied only when drawing.
 */

/** Integer display scale used when a map config omits `zoom`. 1 = tiles at native pixel size. */
export const MAP_DEFAULT_ZOOM = 1;

/**
 * Time for the camera to close half its remaining gap to the character. Small enough to
 * read as centre-locked (~7px of lag at walk speed on a 16px map, settles ~0.25s after
 * stopping) but enough to soften starts and stops. 0 locks the camera to the character.
 */
export const MAP_CAMERA_EASE_HALF_LIFE_SECONDS = 0.06;

/**
 * Below this distance the camera finishes its ease. Under half a map pixel the rounded
 * draw position can't change, so trailing on would only burn frames.
 */
export const MAP_CAMERA_SNAP_DISTANCE_PX = 0.5;

/** Fill shown where no tile is drawn yet (tileset still loading) or a layer leaves gaps. */
export const MAP_BACKGROUND_COLOR = '#87CEEB';

/*
 * Marker rendering. Sizes are in marker pixels: map pixels on a 16px-tile map, and
 * scaled by a whole number on bigger tiles (see `getMapMarkerScale`), so the Jirby
 * symbols always draw at an exact multiple of their native size.
 */

/** Marker bob speed. Time-based, so it runs at the same pace at any frame rate. */
export const MAP_MARKER_PULSE_RADIANS_PER_SECOND = 3;

/** How far a marker bobs, up and down. Whole pixels only, so the art stays crisp. */
export const MAP_MARKER_BOB_PX = 1;

/**
 * How far a marker reaches beyond its tile: the plate's lift, check overhang and bob
 * above, its sides, and the shadow below. Markers whose tile is further than this
 * outside the view are not drawn.
 */
export const MAP_MARKER_CULL_MARGIN_PX = 8;

/** Edge length of a node marker's plate. Bigger than the 16px symbol it carries. */
export const MAP_MARKER_PLATE_SIZE_PX = 20;

/** The plate stands on its tile's bottom edge, so it rises this far above the tile (one symbol cell). */
export const MAP_MARKER_PLATE_LIFT_PX = MAP_MARKER_PLATE_SIZE_PX - JIRBY_SYMBOL_SHEET.cellSize;

/** Inset of the symbol from the plate's top-left corner. */
export const MAP_MARKER_SYMBOL_INSET_PX = 2;

/** The 1px ring around every plate, in the dark of Pixel Crawler outlines. */
export const MAP_MARKER_OUTLINE_COLOR = '#18100c';

/** Plate of a completed node, whatever its type. */
export const MAP_MARKER_DONE_PLATE: MarkerPlatePalette = { fill: '#5f5c58', highlight: '#807c77', shade: '#3e3c39' };

/** Ground shadows: under a plate, and under a floating symbol. `overlapPx` tucks it under what casts it. */
export const MAP_MARKER_SHADOW = {
  color: 'rgba(10, 8, 6, 0.43)',
  plateWidth: 16,
  floatWidth: 12,
  height: 3,
  overlapPx: 1,
} as const;

/** How high floor loot and dialogue triggers float above their tile. */
export const MAP_MARKER_FLOAT_LIFT_PX = 3;

/** The completed-node badge: the bare Jirby check, cropped to its visible pixels. */
export const MAP_MARKER_CHECK = {
  symbol: 'check',
  crop: { x: 4, y: 6, width: 9, height: 8 },
  /** How far the badge sticks out past the plate's top-right corner. */
  overhangPx: 3,
} as const satisfies { symbol: JirbyColorSymbolName; crop: PixelRect; overhangPx: number };

/** Floating symbol of an uncollected floor loot spot. */
export const MAP_FLOOR_LOOT_SYMBOL: JirbyColorSymbolName = 'coin';

/** Floating symbol of an unvisited dialogue trigger. */
export const MAP_DIALOGUE_TRIGGER_SYMBOL: JirbyColorSymbolName = 'exclamation';

/** The minimap pin of an unvisited dialogue trigger. */
export const MAP_DIALOGUE_TRIGGER_WHITE_SYMBOL: JirbyWhiteSymbolName = 'exclamation';

/** Atlas columns, in order. */
export const MAP_NODE_MARKER_STATES: readonly NodeMarkerState[] = ['todo', 'done', 'doneActive'];

export const MAP_NODE_MARKER_STYLES: Record<MapNodeType, MapNodeMarkerStyle> = {
  Battle: { symbol: 'sword', whiteSymbol: 'sword', plate: { fill: '#963c37', highlight: '#ca514a', shade: '#612724' } },
  Boss: { symbol: 'beast', whiteSymbol: 'beast', plate: { fill: '#6e3c78', highlight: '#9451a2', shade: '#47274e' } },
  Town: { symbol: 'house', whiteSymbol: 'house', plate: { fill: '#3c5f8c', highlight: '#5180bd', shade: '#273e5b' } },
  Dungeon: {
    symbol: 'tombstone',
    whiteSymbol: 'tombstone',
    plate: { fill: '#466e69', highlight: '#5e948e', shade: '#2d4744' },
  },
  Treasure: {
    symbol: 'chest',
    whiteSymbol: 'chest',
    plate: { fill: '#966e3c', highlight: '#ca9451', shade: '#614727' },
  },
  Mystery: {
    symbol: 'question',
    whiteSymbol: 'question',
    plate: { fill: '#6e508c', highlight: '#946cbd', shade: '#47345b' },
  },
};
