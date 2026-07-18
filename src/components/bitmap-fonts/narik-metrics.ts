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
 * ── How it's generated (do not hand-edit blindly) ────────────────────────
 * The values below are produced by scanning the sprite's opaque pixels — they
 * are NOT hand-authored. To regenerate (e.g. if the artist updates the sheet):
 *
 *     node scripts/measure-bitmap-font.mjs narik
 *
 * ...then paste its stdout over the object literal below. That script scans
 * each 15px-wide cell for the leftmost/rightmost ink column per glyph.
 *
 * ── How to read a value ──────────────────────────────────────────────────
 * Units are **native px relative to the 15px cell**. {@link BitmapText} scales
 * them by the rendered cell width, so one table works for every `size` and for
 * both the 1x and 5x sheets.
 *   • `l` = left bearing — transparent columns before the glyph's ink. Used
 *           only to offset the sprite crop so the right pixels show (it does
 *           NOT affect spacing; that's what NARIK_TRACKING is for). Most Narik
 *           glyphs sit at l:1 (1px of built-in left padding); ':' is centred
 *           narrow punctuation at l:3.
 *   • `w` = ink width — used as the glyph's advance width. Full-bodied glyphs
 *           top out around 12–13 (e.g. M, O, Q) since the artist leaves ~2–3px
 *           of the 15px cell empty; thin glyphs are much smaller (i/l = 4).
 *
 * Both sheets share identical geometry (only the coloring differs), so this
 * single table drives proportional layout for both fonts.
 */
export const NARIK_GLYPH_METRICS: Record<string, { l: number; w: number }> = {
  A: { l: 1, w: 12 }, B: { l: 1, w: 12 }, C: { l: 1, w: 12 }, D: { l: 1, w: 12 }, E: { l: 1, w: 12 }, F: { l: 1, w: 12 }, G: { l: 1, w: 12 }, H: { l: 1, w: 12 }, I: { l: 1, w: 10 }, J: { l: 1, w: 11 }, K: { l: 1, w: 12 }, L: { l: 1, w: 10 },
  M: { l: 1, w: 12 }, N: { l: 1, w: 12 }, O: { l: 1, w: 12 }, P: { l: 1, w: 12 }, Q: { l: 1, w: 13 }, R: { l: 1, w: 12 }, S: { l: 1, w: 12 }, T: { l: 1, w: 12 }, U: { l: 1, w: 12 }, V: { l: 1, w: 12 }, W: { l: 1, w: 12 }, X: { l: 1, w: 11 },
  Y: { l: 1, w: 11 }, Z: { l: 1, w: 12 }, '1': { l: 1, w: 7 }, '2': { l: 1, w: 10 }, '3': { l: 1, w: 12 }, '4': { l: 1, w: 11 }, '5': { l: 1, w: 12 }, '6': { l: 1, w: 12 }, '7': { l: 1, w: 11 }, '8': { l: 1, w: 12 }, '9': { l: 1, w: 12 }, '0': { l: 1, w: 9 },
  a: { l: 1, w: 11 }, b: { l: 1, w: 12 }, c: { l: 1, w: 12 }, d: { l: 1, w: 12 }, e: { l: 1, w: 12 }, f: { l: 1, w: 11 }, g: { l: 1, w: 12 }, h: { l: 1, w: 12 }, i: { l: 1, w: 4 }, j: { l: 1, w: 8 }, k: { l: 1, w: 10 }, l: { l: 1, w: 4 },
  m: { l: 1, w: 12 }, n: { l: 1, w: 12 }, o: { l: 1, w: 12 }, p: { l: 1, w: 12 }, q: { l: 1, w: 12 }, r: { l: 1, w: 9 }, s: { l: 1, w: 12 }, t: { l: 1, w: 8 }, u: { l: 1, w: 12 }, v: { l: 1, w: 11 }, w: { l: 1, w: 12 }, x: { l: 1, w: 11 },
  y: { l: 1, w: 12 }, z: { l: 1, w: 11 }, ':': { l: 3, w: 5 },
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
