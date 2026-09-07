/**
 * Shared text utilities: bitmap-font normalization and formatting.
 *
 * Add general-purpose, text-based helpers here (not domain-specific ones).
 */

/* ------------------------------------------------------------------ */
/*  Bitmap-font normalization                                          */
/* ------------------------------------------------------------------ */

/**
 * Characters with no bitmap glyph → the ASCII text rendered in their place.
 *
 * The Narik bitmap fonts ship a limited charset (A–Z, a–z, 0–9, ':'), so some
 * common typographic characters have no glyph. All keys are single BMP code
 * units, which keeps {@link normalizeForBitmap} a simple code-unit scan.
 */
export const GLYPH_FALLBACKS: Record<string, string> = {
  '–': '-', // en dash
  '—': '-', // em dash
  '…': '...', // horizontal ellipsis
};

/**
 * Replaces characters that have no bitmap glyph with their ASCII equivalent
 * from {@link GLYPH_FALLBACKS}, before rendering with a bitmap font.
 *
 * Single pass with lazy allocation: text containing no fallback character is
 * returned unchanged (same string reference, zero allocation) — the common
 * case for a renderer invoked on every label.
 *
 * @param text - The raw text to be rendered by a bitmap font.
 * @returns The text with unsupported characters substituted.
 */
export function normalizeForBitmap(text: string): string {
  let out: string | null = null; // allocate lazily, only once a fallback is hit
  for (let i = 0; i < text.length; i++) {
    const replacement = GLYPH_FALLBACKS[text[i]];
    if (replacement === undefined) {
      if (out !== null) out += text[i];
    } else {
      if (out === null) out = text.slice(0, i);
      out += replacement;
    }
  }
  return out ?? text;
}

/* ------------------------------------------------------------------ */
/*  Number formatting                                                  */
/* ------------------------------------------------------------------ */

/**
 * Formats a level as a fixed-width, zero-padded string.
 * The game's level range is 1–99, so the default width is 2 (1 → "01", 99 → "99").
 * Values longer than `width` are returned unpadded (100 → "100").
 * @param level - Level to format (truncated to an integer).
 * @param width - Minimum digit count. Defaults to 2.
 * @returns Zero-padded level string.
 * @example
 * formatLevel(1) // "01"
 * formatLevel(42) // "42"
 * formatLevel(7, 3) // "007"
 */
export function formatLevel(level: number, width = 2): string {
  return Math.trunc(level).toString().padStart(width, '0');
}
