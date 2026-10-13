import { STELLA_SV_FRAME_PX, STELLA_SV_MOTIONS, type StellaMotion } from '~/constants/stella-sprites';

/**
 * Pixel origin of one frame on a Stella side-view battler sheet.
 *
 * @param motion - The motion block to read from.
 * @param frame - Frame within the motion (0–2).
 * @returns The top-left corner of the frame, in sheet pixels.
 */
export function getStellaMotionOrigin(motion: StellaMotion, frame = 0): { x: number; y: number } {
  const { col, row } = STELLA_SV_MOTIONS[motion];
  return { x: (col + frame) * STELLA_SV_FRAME_PX, y: row * STELLA_SV_FRAME_PX };
}
