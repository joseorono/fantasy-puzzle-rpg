/**
 * Generic bitmap-font text renderer.
 *
 * Each bitmap font defines a {@link BitmapFontConfig} and a pre-built
 * character map, then delegates rendering to {@link BitmapText}.
 */

/* ------------------------------------------------------------------ */
/*  Shared types & helpers                                             */
/* ------------------------------------------------------------------ */

/** Per-glyph metrics, in native px relative to the fixed cell. */
export interface GlyphMetric {
  /** Left bearing: transparent columns before the glyph ink. */
  l: number;
  /** Ink width, used as the glyph's advance width. */
  w: number;
}

/** Describes a bitmap font sprite sheet. */
export interface BitmapFontConfig {
  /** Every character in sprite order (left→right, top→bottom). */
  charset: string;
  /** Columns per row in the sprite grid. */
  cols: number;
  /** Native character width in pixels (1×). */
  charW: number;
  /** Native character height in pixels (1×). */
  charH: number;
  /** Path to the 1× sprite sheet. */
  image1x: string;
  /** Path to the 5× sprite sheet. */
  image5x: string;
  /**
   * Sane default glyph metric. When present the font is rendered
   * proportionally (each glyph cropped to its ink width + {@link tracking}
   * gap), with {@link metrics} supplying per-glyph outliers; when absent the
   * font falls back to fixed-cell monospace layout.
   */
  defaultMetric?: GlyphMetric;
  /** Per-glyph overrides — only glyphs that differ from {@link defaultMetric}. */
  metrics?: Record<string, GlyphMetric>;
  /** Uniform gap between glyphs, in native px (proportional mode only). */
  tracking?: number;
  /** Advance width of a space, in native px (proportional mode only). */
  spaceWidth?: number;
}

/** Pre-computes a character → [col, row] lookup from a config's charset. */
// eslint-disable-next-line react-refresh/only-export-components
export function buildCharMap(
  charset: string,
  cols: number,
): Map<string, [col: number, row: number]> {
  const map = new Map<string, [number, number]>();
  for (let i = 0; i < charset.length; i++) {
    map.set(charset[i], [i % cols, Math.floor(i / cols)]);
  }
  return map;
}

/** Scales ≥ this value use the pre-scaled 5× sheet for sharper results. */
const HI_RES_THRESHOLD = 5;

const GLYPH_FALLBACKS: Record<string, string> = {
  '–': '-',
  '—': '-',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface BitmapTextProps {
  text: string;
  /** Integer scale multiplier (default 1 = native size per character). */
  size?: number;
}

interface InternalProps extends BitmapTextProps {
  config: BitmapFontConfig;
  charMap: Map<string, [number, number]>;
  sheetRows: number;
}

export function BitmapText({ text, size = 1, config, charMap, sheetRows }: InternalProps) {
  const useHiRes = size >= HI_RES_THRESHOLD;
  const image = useHiRes ? config.image5x : config.image1x;
  const nativeW = useHiRes ? config.charW * HI_RES_THRESHOLD : config.charW;
  const nativeH = useHiRes ? config.charH * HI_RES_THRESHOLD : config.charH;
  const scale = useHiRes ? size / HI_RES_THRESHOLD : size;

  const cw = nativeW * scale;
  const ch = nativeH * scale;
  const sw = config.cols * cw;
  const sh = sheetRows * ch;

  // Native px → rendered px (relative to the cell), for proportional metrics.
  // Proportional mode is active when the font declares a defaultMetric; each
  // glyph then resolves as `metrics[char] ?? defaultMetric`.
  const { defaultMetric, metrics, tracking = 0, spaceWidth = 0 } = config;
  const proportional = defaultMetric !== undefined;
  const toPx = (nativePx: number) => (nativePx / config.charW) * cw;
  const gap = proportional ? toPx(tracking) : 0;
  const blankWidth = proportional ? toPx(spaceWidth) : cw;

  const containerStyle = {
    '--bf-img': `url(${image})`,
    '--bf-cw': `${cw}px`,
    '--bf-ch': `${ch}px`,
    '--bf-sw': `${sw}px`,
    '--bf-sh': `${sh}px`,
    '--bf-gap': `${gap}px`,
  } as React.CSSProperties;

  return (
    <span className="bf-text" style={containerStyle}>
      <span className="sr-only">{text}</span>
      <span className="bf-row" aria-hidden="true">
        {Array.from(text).map((char, i) => {
          const displayChar = GLYPH_FALLBACKS[char] ?? char;
          const pos = charMap.get(displayChar);
          if (!pos) {
            return <span key={i} className="bf-blank" style={{ width: `${blankWidth}px` }} />;
          }
          const metric = proportional ? (metrics?.[displayChar] ?? defaultMetric) : undefined;
          const charStyle: React.CSSProperties = metric
            ? {
                width: `${toPx(metric.w)}px`,
                backgroundPosition: `${-(pos[0] * cw + toPx(metric.l))}px ${-pos[1] * ch}px`,
              }
            : {
                backgroundPosition: `${-pos[0] * cw}px ${-pos[1] * ch}px`,
              };
          return <span key={i} className="bf-char" style={charStyle} />;
        })}
      </span>
    </span>
  );
}
