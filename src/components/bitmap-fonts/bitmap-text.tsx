/**
 * Generic bitmap-font text renderer.
 *
 * Each bitmap font defines a {@link BitmapFontConfig} and a pre-built
 * character map, then delegates rendering to {@link BitmapText}.
 */

/* ------------------------------------------------------------------ */
/*  Shared types & helpers                                             */
/* ------------------------------------------------------------------ */

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
}

/** Pre-computes a character → [col, row] lookup from a config's charset. */
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

export function BitmapText({
  text,
  size = 1,
  config,
  charMap,
  sheetRows,
}: InternalProps) {
  const useHiRes = size >= HI_RES_THRESHOLD;
  const image = useHiRes ? config.image5x : config.image1x;
  const nativeW = useHiRes ? config.charW * HI_RES_THRESHOLD : config.charW;
  const nativeH = useHiRes ? config.charH * HI_RES_THRESHOLD : config.charH;
  const scale = useHiRes ? size / HI_RES_THRESHOLD : size;

  const cw = nativeW * scale;
  const ch = nativeH * scale;
  const sw = config.cols * cw;
  const sh = sheetRows * ch;

  const containerStyle = {
    '--bf-img': `url(${image})`,
    '--bf-cw': `${cw}px`,
    '--bf-ch': `${ch}px`,
    '--bf-sw': `${sw}px`,
    '--bf-sh': `${sh}px`,
  } as React.CSSProperties;

  return (
    <span className="bf-text" style={containerStyle}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((char, i) => {
          const pos = charMap.get(char);
          if (!pos) {
            return <span key={i} className="bf-blank" />;
          }
          return (
            <span
              key={i}
              className="bf-char"
              style={{
                backgroundPosition: `${-pos[0] * cw}px ${-pos[1] * ch}px`,
              }}
            />
          );
        })}
      </span>
    </span>
  );
}
