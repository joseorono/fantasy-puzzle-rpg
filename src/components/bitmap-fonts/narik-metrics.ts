/**
 * Per-glyph metrics for the Narik bitmap fonts (Wood & RedWood).
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * The Narik fonts are PNG sprite sheets laid out as a fixed 15x25 monospace
 * grid. Rendering every glyph in a full 15px cell looks awful, because narrow
 * glyphs (i, l, t, 1, :) and the space float in oversized cells and mixed-case
 * words get uneven gaps. This table gives each glyph its real ink width so
 * {@link BitmapText} can render the font *proportionally* instead.
 *
 * ── Default + overrides model ─────────────────────────────────────────────
 * Most Narik glyphs are full-bodied and share one metric, so instead of listing
 * all 63 we store a single {@link NARIK_DEFAULT_METRIC} (covers 40/63) and only
 * the outliers in {@link NARIK_GLYPH_METRICS}. {@link BitmapText} resolves each
 * glyph as `overrides[char] ?? defaultMetric`, so a glyph missing below simply
 * uses the default.
 *
 * ── How it's generated (do not hand-edit blindly) ────────────────────────
 * These values are produced by scanning the sprite's opaque pixels — they are
 * NOT hand-authored. To regenerate (e.g. if the artist updates the sheet):
 *
 *     node scripts/measure-bitmap-font.mjs narik
 *
 * That prints the detected `DEFAULT` and an overrides-only object; paste them
 * over the two exports below.
 *
 * ── How to read a value ──────────────────────────────────────────────────
 * Units are **native px relative to the 15px cell**. {@link BitmapText} scales
 * them by the rendered cell width, so the same numbers work for every `size`
 * and for both the 1x and 5x sheets.
 *   • `l` = left bearing — transparent columns before the glyph's ink. Used
 *           only to offset the sprite crop so the right pixels show (it does
 *           NOT affect spacing; that's what NARIK_TRACKING is for). Almost all
 *           glyphs sit at l:1; ':' is centred narrow punctuation at l:3.
 *   • `w` = ink width — used as the glyph's advance width. Full-bodied glyphs
 *           are ~12–13 (the artist leaves ~2–3px of the 15px cell empty); thin
 *           glyphs are much smaller (i/l = 4).
 *
 * Both sheets share identical geometry (only the coloring differs), so these
 * drive proportional layout for both fonts.
 */

/** The common case: a full-bodied glyph in the 15px cell. Glyphs not listed in
 *  {@link NARIK_GLYPH_METRICS} use this. */
export const NARIK_DEFAULT_METRIC = { l: 1, w: 12 };

/** Per-glyph overrides — only the glyphs that differ from {@link NARIK_DEFAULT_METRIC}
 *  (the narrow/trimmed outliers). */
export const NARIK_GLYPH_METRICS: Record<string, { l: number; w: number }> = {
  I: { l: 1, w: 10 }, J: { l: 1, w: 11 }, L: { l: 1, w: 10 }, Q: { l: 1, w: 13 }, X: { l: 1, w: 11 }, Y: { l: 1, w: 11 },
  '0': { l: 1, w: 9 }, '1': { l: 1, w: 7 }, '2': { l: 1, w: 10 }, '4': { l: 1, w: 11 }, '7': { l: 1, w: 11 },
  a: { l: 1, w: 11 }, f: { l: 1, w: 11 }, i: { l: 1, w: 4 }, j: { l: 1, w: 8 }, k: { l: 1, w: 10 }, l: { l: 1, w: 4 },
  r: { l: 1, w: 9 }, t: { l: 1, w: 8 }, v: { l: 1, w: 11 }, x: { l: 1, w: 11 }, z: { l: 1, w: 11 },
  ':': { l: 3, w: 5 },
};

/**
 * Uniform gap inserted between every glyph, in native px (scaled by `size`).
 *
 * Because {@link NARIK_GLYPH_METRICS} crops each glyph to its exact ink, glyphs
 * would otherwise touch. This is the only knob controlling letter tightness.
 * Higher = more airy, lower = tighter. Rendered as the flex `gap` on `.bf-row`
 * (see fonts.css / bitmap-text.tsx). Tune by eye in the Test View.
 */
export const NARIK_TRACKING = 2;

/**
 * Advance width of a space character, in native px (scaled by `size`).
 *
 * The space isn't a sprite glyph, so its width is set here rather than
 * measured. The visible gap between two words is
 * `NARIK_SPACE_WIDTH + 2 * NARIK_TRACKING` (a tracking gap sits on each side of
 * the space), i.e. ~8px at size 1 with the defaults. Increase if words look
 * cramped; decrease if the gap looks too wide.
 */
export const NARIK_SPACE_WIDTH = 4;
