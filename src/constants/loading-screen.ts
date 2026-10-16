import type { LoadingCog } from '~/types/loading-screen';

/** Shortest time (ms) the map loading screen stays up, even when the map is ready sooner. */
export const MAP_LOADING_MIN_DURATION_MS = 3000;

/** Map loading screen fade-out (ms), handed to the CSS as `--map-loading-fade-ms`. */
export const MAP_LOADING_FADE_MS = 450;

const COG_DIR = '/assets/decorations/karsiori-cogs';

/** The lower-right gear cluster. Gear 9 anchors it; the other two mesh with it and so turn the other way. */
export const MAP_LOADING_COGS: readonly LoadingCog[] = [
  {
    src: `${COG_DIR}/gear-09-bronze.png`,
    frameSizePx: 59,
    frames: 4,
    scale: 2,
    cycleMs: 600,
    isReversed: false,
    rightPx: 0,
    bottomPx: 0,
  },
  {
    src: `${COG_DIR}/gear-08-bronze.png`,
    frameSizePx: 51,
    frames: 4,
    scale: 2,
    cycleMs: 520,
    isReversed: true,
    rightPx: 78,
    bottomPx: 78,
  },
  {
    src: `${COG_DIR}/gear-06-bronze.png`,
    frameSizePx: 26,
    frames: 4,
    scale: 2,
    cycleMs: 265,
    isReversed: true,
    rightPx: 110,
    bottomPx: 13,
  },
];
