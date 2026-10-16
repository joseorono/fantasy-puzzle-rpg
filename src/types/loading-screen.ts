/**
 * One animated gear on the loading screen. The sheet is a horizontal strip of square frames;
 * positions are offsets from the cluster's bottom-right corner, in on-screen pixels.
 */
export interface LoadingCog {
  src: string;
  /** Side of one square frame in the source sheet. */
  frameSizePx: number;
  frames: number;
  /** Integer upscale, so the pixel art stays crisp. */
  scale: number;
  /** One pass through the strip. Bigger gears get longer cycles so meshing teeth keep pace. */
  cycleMs: number;
  /** Mirrors the sheet so this gear turns against its neighbours. */
  isReversed: boolean;
  rightPx: number;
  bottomPx: number;
}
