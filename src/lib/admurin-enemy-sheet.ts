import type { AdmurinEnemyAnimation, AdmurinEnemySheet } from '~/types/admurin-enemies';

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
  animation: Pick<AdmurinEnemyAnimation, 'frames' | 'frameDurationMs'>,
): number {
  return animation.frames * animation.frameDurationMs;
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

/**
 * How much to zoom the cell so the character fills the card. One cell height maps to the card, and
 * the character's longest side should too; the zoom is anchored on the cell's bottom-center, where
 * the art sits. Without it the enemy floats small inside a mostly empty card.
 */
export function getAdmurinDisplayZoom(sheet: Pick<AdmurinEnemySheet, 'cellH' | 'characterRect'>): number {
  const longest = Math.max(sheet.characterRect.width, sheet.characterRect.height);
  return longest > 0 ? sheet.cellH / longest : 1;
}
