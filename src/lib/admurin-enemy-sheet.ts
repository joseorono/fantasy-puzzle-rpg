import type { AdmurinEnemyAnimation, AdmurinEnemySheet } from '~/types/admurin-enemies';

/** `linear()` easings are required to honor custom frame sequences. */
export const SUPPORTS_ADMURIN_FRAME_SEQUENCE =
  typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');

/** Native-pixel origin (top-left) of an animation's frame 0 on its sheet. */
export function getAdmurinAnimationOrigin(
  sheet: Pick<AdmurinEnemySheet, 'cellH'>,
  animation: Pick<AdmurinEnemyAnimation, 'row'>,
): { x: number; y: number } {
  // Every row starts at the left edge; rows stack top to bottom.
  return { x: 0, y: animation.row * sheet.cellH };
}

/** Full playthrough duration of an animation, in ms. */
export function getAdmurinAnimationCycleMs(
  animation: Pick<AdmurinEnemyAnimation, 'frames' | 'frameDurationMs' | 'frameSequence'>,
  supportsLinearEasing = true,
): number {
  return getAdmurinAnimationStepCount(animation, supportsLinearEasing) * animation.frameDurationMs;
}

/** Number of timeline steps the sprite player will render, including compatibility fallback. */
export function getAdmurinAnimationStepCount(
  animation: Pick<AdmurinEnemyAnimation, 'frames' | 'frameSequence'>,
  supportsLinearEasing = true,
): number {
  return supportsLinearEasing && animation.frameSequence?.length ? animation.frameSequence.length : animation.frames;
}

/** Trims float noise so generated easings stay readable (16.6667, not 16.666666666666668). */
const round4 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * The `animation-timing-function` for an animation row. A plain row steps one cell per frame
 * (`steps(frames, end)`); a `frameSequence` compiles to a `linear()` easing whose flat segments
 * jump between cell offsets — same compositor-only transform, arbitrary order/repeats.
 */
export function getAdmurinAnimationTimingFunction(
  animation: Pick<AdmurinEnemyAnimation, 'frames' | 'frameSequence'>,
): string {
  const sequence = animation.frameSequence;
  if (!sequence || sequence.length === 0) return `steps(${animation.frames}, end)`;
  // Consecutive repeats merge into one flat segment: [1, 1] -> `0.1111 25% 75%`, not two stops.
  const stops: string[] = [];
  let segmentStart = 0;
  for (let index = 0; index < sequence.length; index += 1) {
    if (index < sequence.length - 1 && sequence[index + 1] === sequence[index]) continue;
    const value = round4(sequence[index] / animation.frames);
    const start = round4((segmentStart / sequence.length) * 100);
    const end = round4(((index + 1) / sequence.length) * 100);
    stops.push(`${value} ${start}% ${end}%`);
    segmentStart = index + 1;
  }
  return `linear(${stops.join(', ')})`;
}

/** Selects the row's timing function for this browser's CSS feature support. */
export function getAdmurinAnimationTimingFunctionForSupport(
  animation: Pick<AdmurinEnemyAnimation, 'frames' | 'frameSequence'>,
  supportsLinearEasing: boolean,
): string {
  return supportsLinearEasing && animation.frameSequence?.length
    ? getAdmurinAnimationTimingFunction(animation)
    : `steps(${animation.frames}, end)`;
}

/** The attack row a combat attack index plays; wraps to what the sheet actually has. Returns undefined when the sheet has no attack rows. */
export function resolveAdmurinAttackAnimation(
  sheet: Pick<AdmurinEnemySheet, 'animations'>,
  attackIndex: number,
): AdmurinEnemyAnimation | undefined {
  const attacks = sheet.animations.attacks;
  if (!attacks || attacks.length === 0) return undefined;
  // Positive modulo so an out-of-range index still lands on a real row.
  return attacks[((attackIndex % attacks.length) + attacks.length) % attacks.length];
}

/** Total rows on a sheet (highest animation row + 1). Sizes the strip so one row maps to one cell. */
export function getAdmurinSheetRowCount(sheet: Pick<AdmurinEnemySheet, 'animations'>): number {
  const { idle, move, hurt, attacks, ability } = sheet.animations;
  const rows = [idle, move, hurt, ...(attacks ?? []), ability]
    .filter((animation): animation is AdmurinEnemyAnimation => animation !== undefined)
    .map((animation) => animation.row);
  return Math.max(...rows) + 1;
}

/** CSS background offset that aligns one source row to a cell-height strip without translating the sheet vertically. */
export function getAdmurinRowBackgroundPosition(
  sheet: Pick<AdmurinEnemySheet, 'animations'>,
  animation: Pick<AdmurinEnemyAnimation, 'row'>,
): string {
  const rowCount = getAdmurinSheetRowCount(sheet);
  const offsetPercent = rowCount > 1 ? (animation.row / (rowCount - 1)) * 100 : 0;
  return `0 ${round4(offsetPercent)}%`;
}

/** Scales a sheet to its full row height while preserving its source aspect ratio. */
export function getAdmurinBackgroundSize(sheet: Pick<AdmurinEnemySheet, 'animations'>): string {
  return `auto ${getAdmurinSheetRowCount(sheet) * 100}%`;
}

/** Fraction of the card left empty around the sprite: nothing should ever touch the card edge. */
export const ADMURIN_CARD_PADDING = 0.08;

/**
 * Floor on how much smaller than the idle an attack pose may get, as a fraction of the idle zoom.
 * The frog's tongue reaches ~3x its body, so a pure fit would shrink the enemy to a dot; flooring
 * it keeps the character readable and lets the far tip of the longest attack clip at the card edge.
 */
export const ADMURIN_MIN_ZOOM_RATIO = 0.6;

/** Zoom that fits one pose inside the card, idles being the reference size. */
function fitZoom(sheet: Pick<AdmurinEnemySheet, 'cellH'>, rect: { width: number; height: number }): number {
  const longest = Math.max(rect.width, rect.height);
  return longest > 0 ? (sheet.cellH / longest) * (1 - 2 * ADMURIN_CARD_PADDING) : 1;
}

/**
 * Scale for one animation, never smaller than {@link ADMURIN_MIN_ZOOM_RATIO} of the idle's. Per
 * animation because a long reach has to shrink to stay on screen; floored because that reach can be
 * many times the body, and the enemy still has to read as itself.
 */
export function getAdmurinAnimationZoom(
  sheet: Pick<AdmurinEnemySheet, 'cellH' | 'animations'>,
  animation: Pick<AdmurinEnemyAnimation, 'rect'>,
): number {
  return Math.max(fitZoom(sheet, animation.rect), fitZoom(sheet, sheet.animations.idle.rect) * ADMURIN_MIN_ZOOM_RATIO);
}

export interface AdmurinPlacement {
  zoom: number;
  /** Centre of this animation's content inside a cell, as a percentage — what lands on the card's centre. */
  centerXPercent: number;
  centerYPercent: number;
}

/**
 * Where one animation's pose sits: its own content is centred on the card (the body slides out of
 * the way of a long tongue, like a lunge) and scaled to fit, so nothing depends on anchoring feet.
 */
export function getAdmurinPlacement(
  sheet: Pick<AdmurinEnemySheet, 'cellW' | 'cellH' | 'animations'>,
  animation: Pick<AdmurinEnemyAnimation, 'rect'>,
): AdmurinPlacement {
  const { rect } = animation;
  return {
    zoom: getAdmurinAnimationZoom(sheet, animation),
    centerXPercent: ((rect.x + rect.width / 2) / sheet.cellW) * 100,
    centerYPercent: ((rect.y + rect.height / 2) / sheet.cellH) * 100,
  };
}
