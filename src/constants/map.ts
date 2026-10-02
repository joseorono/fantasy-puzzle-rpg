import type { MapNodeType } from '~/stores/slices/map-progress.types';

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
 * Marker rendering. Sizes are in map pixels (pre-zoom), the same space the canvas
 * draws tiles in.
 */

/** Marker pulse speed. Time-based, so it runs at the same pace at any frame rate. */
export const MAP_MARKER_PULSE_RADIANS_PER_SECOND = 3;

/**
 * How far a marker's glow can reach beyond its tile. Markers whose tile is further than
 * this outside the view are not drawn.
 */
export const MAP_MARKER_CULL_MARGIN_PX = 64;

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

/** Look of a node marker. Colours are `rgba(` prefixes; the draw code appends the alpha. */
export interface MapNodeMarkerStyle {
  color: string;
  doneColor: string;
  icon: string;
  /** Icon once the node is completed, when it differs from `icon`. */
  doneIcon?: string;
}

export const MAP_NODE_MARKER_STYLES: Record<MapNodeType, MapNodeMarkerStyle> = {
  Battle: { color: 'rgba(220, 20, 60, ', doneColor: 'rgba(255, 100, 100, ', icon: '⚔' },
  Boss: { color: 'rgba(138, 43, 226, ', doneColor: 'rgba(200, 100, 255, ', icon: '👑' },
  Town: { color: 'rgba(30, 144, 255, ', doneColor: 'rgba(100, 150, 255, ', icon: '🏠' },
  Dungeon: { color: 'rgba(0, 176, 158, ', doneColor: 'rgba(128, 208, 198, ', icon: '💀' },
  Treasure: { color: 'rgba(255, 215, 0, ', doneColor: 'rgba(255, 255, 150, ', icon: '🎁', doneIcon: '📦' },
  Mystery: { color: 'rgba(148, 0, 211, ', doneColor: 'rgba(200, 150, 255, ', icon: '❓' },
};
