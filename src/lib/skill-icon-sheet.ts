/**
 * Cell resolution for the skill icon spritesheets.
 *
 * Callers address icons by hand-written grid coordinates, so an out-of-range
 * `row`/`col` is the expected failure mode. These helpers turn a position into
 * a validated icon index, or an explicit reason why it isn't one.
 */

import type { SkillSheetConfig } from '~/constants/skill-icons';
import type { GridPosition } from '~/types/geometry';

/** Why a grid position does not name a real icon. */
export type SkillCellError = 'not-integer' | 'negative' | 'out-of-grid' | 'past-last-icon';

export type SkillCellResult = { ok: true; index: number } | { ok: false; reason: SkillCellError };

/**
 * Resolves a grid position to its icon index within a sheet.
 *
 * Checks run in order of severity, so the reason names the first thing wrong.
 * The `past-last-icon` case is the one a plain `row < rows && col < cols` test
 * misses: every sheet's last row is partially filled, leaving a band of cells
 * that are inside the grid but transparent.
 *
 * @param config Geometry of the sheet being addressed.
 * @param position Grid position of the normal (left-hand) icon.
 * @returns The icon index, or the reason the position is invalid.
 */
export function resolveSkillIconIndex(config: SkillSheetConfig, position: GridPosition): SkillCellResult {
  const { row, col } = position;

  if (!Number.isInteger(row) || !Number.isInteger(col)) return { ok: false, reason: 'not-integer' };
  if (row < 0 || col < 0) return { ok: false, reason: 'negative' };
  if (row >= config.rows || col >= config.cols) return { ok: false, reason: 'out-of-grid' };

  const index = row * config.cols + col;
  if (index >= config.iconCount) return { ok: false, reason: 'past-last-icon' };

  return { ok: true, index };
}

/**
 * Grid position of an icon index. Inverse of {@link resolveSkillIconIndex}.
 *
 * @param config Geometry of the sheet being addressed.
 * @param index Zero-based icon index.
 */
export function skillIconPosition(config: SkillSheetConfig, index: number): GridPosition {
  return { row: Math.floor(index / config.cols), col: index % config.cols };
}

/**
 * Cells the grid holds, including the empty tail of the last row. Always at
 * least `iconCount`.
 *
 * @param config Geometry of the sheet being addressed.
 */
export function skillIconCellCount(config: SkillSheetConfig): number {
  return config.rows * config.cols;
}

/**
 * Human-readable explanation of a rejected position, for dev warnings.
 *
 * @param config Geometry of the sheet being addressed.
 * @param position The position that was rejected.
 * @param reason Why it was rejected.
 */
export function describeSkillCellError(
  config: SkillSheetConfig,
  position: GridPosition,
  reason: SkillCellError,
): string {
  const at = `{ row: ${position.row}, col: ${position.col} }`;
  const grid = `${config.cols}x${config.rows}`;

  switch (reason) {
    case 'not-integer':
      return `${at} is not a whole cell — row and col must be integers.`;
    case 'negative':
      return `${at} is negative — row and col must be 0 or greater.`;
    case 'out-of-grid':
      return `${at} is outside the ${grid} grid of "${config.slug}".`;
    case 'past-last-icon':
      return `${at} is an empty cell — "${config.slug}" holds ${config.iconCount} icons in its ${grid} grid.`;
  }
}
