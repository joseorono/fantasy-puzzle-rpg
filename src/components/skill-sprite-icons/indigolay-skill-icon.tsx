/**
 * Generic skill-icon renderer.
 *
 * Each sheet packs a grid of normal icons with an identical grid of disabled
 * icons directly to its right, so both variants of an icon share a row/column
 * and the disabled one sits exactly one half-sheet further along X. Icons are
 * addressed by the {@link GridPosition} of the normal one; `disabled` picks the
 * variant.
 *
 * Both variants are painted as stacked layers and crossfaded on opacity —
 * `background-position` cannot be interpolated without sliding the sheet across
 * the frame. Sheet components define a config and delegate here.
 */

import {
  DEFAULT_SKILL_SHEET_SIZE,
  skillSheetUrl,
  type SkillSheetConfig,
  type SkillSheetSize,
} from '~/constants/skill-icons';
import { describeSkillCellError, resolveSkillIconIndex } from '~/lib/skill-icon-sheet';
import { cn } from '~/lib/utils';
import type { GridPosition } from '~/types/geometry';

export interface IndigolaySkillIconProps {
  /** Grid position of the *normal* icon; the disabled twin is derived from it. */
  position: GridPosition;
  /** Crossfades to the greyed-out variant. */
  disabled?: boolean;
  /** Rendered size in pixels (default = the sheet's native cell size). */
  size?: number;
  /** Which resolution of the sheet to load. */
  sheetSize?: SkillSheetSize;
  /** Additional CSS classes. */
  className?: string;
}

interface InternalProps extends IndigolaySkillIconProps {
  config: SkillSheetConfig;
}

export function IndigolaySkillIcon({
  position,
  disabled = false,
  size,
  sheetSize = DEFAULT_SKILL_SHEET_SIZE,
  className,
  config,
}: InternalProps) {
  const cell = resolveSkillIconIndex(config, position);
  if (!cell.ok) {
    if (import.meta.env.DEV) {
      console.warn(`IndigolaySkillIcon: ${describeSkillCellError(config, position, cell.reason)}`);
    }
    return null;
  }

  const renderSize = size ?? sheetSize;
  const scale = renderSize / sheetSize;
  const scaledCell = sheetSize * scale;
  const halfWidth = config.cols * scaledCell;

  const image = skillSheetUrl(config.slug, sheetSize);
  const backgroundSize = `${halfWidth * 2}px ${config.rows * scaledCell}px`;
  const offsetX = -position.col * scaledCell;
  const offsetY = -position.row * scaledCell;

  return (
    <span
      className={cn('indigolay-skill-icon', className)}
      role="img"
      aria-disabled={disabled}
      style={{ width: renderSize, height: renderSize }}
    >
      <span
        className="indigolay-skill-icon__layer indigolay-art"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
          opacity: disabled ? 0 : 1,
        }}
      />
      <span
        className="indigolay-skill-icon__layer indigolay-art"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize,
          backgroundPosition: `${offsetX - halfWidth}px ${offsetY}px`,
          opacity: disabled ? 1 : 0,
        }}
      />
    </span>
  );
}
