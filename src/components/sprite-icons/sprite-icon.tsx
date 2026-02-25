/**
 * Generic sprite-icon renderer.
 *
 * Each sprite sheet defines a {@link SpriteSheetConfig} and a pre-built
 * icon map, then delegates rendering to {@link SpriteIcon}.
 */

import { cn } from '~/lib/utils';

/* ------------------------------------------------------------------ */
/*  Shared types & helpers                                             */
/* ------------------------------------------------------------------ */

/** Describes a sprite sheet of icons. */
export interface SpriteSheetConfig {
  /** Path to the sprite sheet PNG. */
  image: string;
  /** Native cell width in pixels. */
  cellW: number;
  /** Native cell height in pixels. */
  cellH: number;
  /** Total columns in the sprite sheet. */
  cols: number;
  /** Total rows in the sprite sheet. */
  rows: number;
}

interface SpriteIconProps {
  /** Icon name from the icon map. */
  name: string;
  /** Rendered size in pixels (default = native cell size). */
  size?: number;
  /** Additional CSS classes. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface InternalProps extends SpriteIconProps {
  config: SpriteSheetConfig;
  iconMap: Readonly<Record<string, readonly [col: number, row: number]>>;
}

export function SpriteIcon({
  name,
  size,
  className,
  config,
  iconMap,
}: InternalProps) {
  const pos = iconMap[name];
  if (!pos) return null;

  const renderSize = size ?? config.cellW;
  const scale = renderSize / config.cellW;

  const sheetW = config.cols * config.cellW * scale;
  const sheetH = config.rows * config.cellH * scale;
  const offsetX = -pos[0] * config.cellW * scale;
  const offsetY = -pos[1] * config.cellH * scale;

  return (
    <span
      className={cn('si-icon', className)}
      role="img"
      aria-label={name}
      style={{
        width: renderSize,
        height: renderSize,
        backgroundImage: `url(${config.image})`,
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
}
