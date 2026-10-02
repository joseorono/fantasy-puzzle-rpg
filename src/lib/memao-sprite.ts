import {
  MEMAO_ANIMATIONS,
  MEMAO_DIRECTIONS,
  MEMAO_FRAME_SIZE_PX,
  MEMAO_SHEET_COLUMNS,
  type MemaoAnimationDefinition,
  type MemaoAnimationName,
  type MemaoDirection,
} from '~/constants/memao-sprite';

/** Directions an animation actually has in the sheet. */
function getDirections(animation: MemaoAnimationDefinition): readonly MemaoDirection[] {
  return animation.directions ?? MEMAO_DIRECTIONS;
}

const ANIMATIONS_BY_NAME = new Map<MemaoAnimationName, MemaoAnimationDefinition>(
  MEMAO_ANIMATIONS.map((animation) => [animation.name, animation]),
);

/** Sheet frame index each animation block starts at, summed once from the ordered list. */
const ANIMATION_START_INDEX = new Map<MemaoAnimationName, number>();
let nextStartIndex = 0;
for (const animation of MEMAO_ANIMATIONS) {
  ANIMATION_START_INDEX.set(animation.name, nextStartIndex);
  nextStartIndex += animation.framesPerDirection * getDirections(animation).length;
}

/** Total frames in a Memao sheet. */
export const MEMAO_TOTAL_FRAME_COUNT = nextStartIndex;

/**
 * Returns the definition of a Memao animation.
 *
 * @param name Animation name.
 */
export function getMemaoAnimation(name: MemaoAnimationName): MemaoAnimationDefinition {
  return ANIMATIONS_BY_NAME.get(name)!;
}

/**
 * Number of playback steps in one cycle: the sequence length when the animation
 * has one, else its frame count.
 *
 * @param name Animation name.
 */
export function getMemaoStepCount(name: MemaoAnimationName): number {
  const animation = getMemaoAnimation(name);
  return animation.sequence?.length ?? animation.framesPerDirection;
}

/**
 * How long a playback step stays on screen, in ms. Wraps past the end of the cycle.
 *
 * @param name Animation name.
 * @param step Playback step.
 */
export function getMemaoStepDurationMs(name: MemaoAnimationName, step: number): number {
  const durations = getMemaoAnimation(name).frameDurationsMs;
  return durations[step % durations.length];
}

/**
 * Index of a frame in the packed sheet stream.
 *
 * `step` is a playback step, not a sheet frame: it goes through the animation's
 * `sequence` when there is one, and wraps around the cycle. A direction the animation
 * lacks (paint has only left/right) falls back to the animation's first direction.
 *
 * @param name Animation name.
 * @param direction Facing direction.
 * @param step Playback step.
 */
export function getMemaoFrameIndex(name: MemaoAnimationName, direction: MemaoDirection, step: number): number {
  const animation = getMemaoAnimation(name);
  const directions = getDirections(animation);
  const directionOffset = Math.max(directions.indexOf(direction), 0);

  const stepCount = getMemaoStepCount(name);
  const wrappedStep = ((step % stepCount) + stepCount) % stepCount;
  const frame = animation.sequence?.[wrappedStep] ?? wrappedStep;

  return ANIMATION_START_INDEX.get(name)! + directionOffset * animation.framesPerDirection + frame;
}

/**
 * Top-left pixel origin of a frame in the sheet.
 *
 * @param name Animation name.
 * @param direction Facing direction.
 * @param step Playback step.
 */
export function getMemaoFrameOrigin(
  name: MemaoAnimationName,
  direction: MemaoDirection,
  step: number,
): { x: number; y: number } {
  const index = getMemaoFrameIndex(name, direction, step);
  return {
    x: (index % MEMAO_SHEET_COLUMNS) * MEMAO_FRAME_SIZE_PX,
    y: Math.floor(index / MEMAO_SHEET_COLUMNS) * MEMAO_FRAME_SIZE_PX,
  };
}
