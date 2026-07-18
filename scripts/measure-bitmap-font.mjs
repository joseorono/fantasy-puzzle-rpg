/**
 * Generic metrics generator for grid-based bitmap-font sprite sheets.
 *
 * Bitmap fonts in this project are fixed-cell (charW x charH) monospace grids,
 * but the glyphs inside each cell have varying real widths. This tool decodes a
 * sheet, scans the opaque (ink) pixels in each cell, and emits a per-glyph
 * `{ l: leftBearing, w: inkWidth }` table (in native px) that the renderer uses
 * for proportional layout. See src/components/bitmap-fonts/bitmap-text.tsx.
 *
 * Usage — pick a preset from the FONTS registry below:
 *   node scripts/measure-bitmap-font.mjs narik
 *
 * ...or measure an ad-hoc sheet with flags:
 *   node scripts/measure-bitmap-font.mjs \
 *     --sheet public/assets/fonts/my-font.png \
 *     --cols 12 --char-w 15 --char-h 25 \
 *     --charset "ABC...xyz:"
 *
 * A preset's fields can be overridden by also passing the matching flag.
 * Extra tuning flags: --alpha-threshold <0-255>, --color-threshold <0-765>.
 *
 * The emitted object literal goes to stdout (pipe it to a file); decode
 * diagnostics go to stderr. Dependency-free — uses Node's built-in zlib.
 *
 * To add a font: append an entry to FONTS, then run the tool with its key.
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/* ------------------------------------------------------------------ */
/*  Font registry — add future bitmap fonts here                       */
/* ------------------------------------------------------------------ */

const NARIK_CHARSET =
  'ABCDEFGHIJKL' +
  'MNOPQRSTUVWX' +
  'YZ1234567890' +
  'abcdefghijkl' +
  'mnopqrstuvwx' +
  'yz:';

/** @type {Record<string, {sheet: string, cols: number, charW: number, charH: number, charset: string}>} */
const FONTS = {
  narik: {
    // Both Narik sheets (Wood / RedWood) share identical geometry, so either
    // 1x sheet yields the same table.
    sheet: 'public/assets/fonts/Wood-narik.png',
    cols: 12,
    charW: 15,
    charH: 25,
    charset: NARIK_CHARSET,
  },
};

/** A pixel counts as ink when its alpha exceeds this (alpha-bearing sheets). */
const DEFAULT_ALPHA_THRESHOLD = 32;
/** For sheets with no alpha, ink = |color - corner background| exceeds this. */
const DEFAULT_COLOR_THRESHOLD = 48;

/* ------------------------------------------------------------------ */
/*  PNG decoding (generic, non-interlaced)                             */
/* ------------------------------------------------------------------ */

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/**
 * Decodes a non-interlaced PNG into a per-pixel accessor.
 * Supports color types 0 (grayscale), 2 (RGB), 3 (palette), 4 (grayscale+alpha),
 * 6 (RGBA), at bit depths 1/2/4/8/16.
 */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null; // [{ r, g, b }]
  let trns = null; // colorType 3: per-index alpha
  const idatChunks = [];

  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const dataStart = off + 8;
    const data = buf.subarray(dataStart, dataStart + len);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
      bitDepth = buf[dataStart + 8];
      colorType = buf[dataStart + 9];
      interlace = buf[dataStart + 12];
    } else if (type === 'PLTE') {
      palette = [];
      for (let i = 0; i < data.length; i += 3) {
        palette.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    } else if (type === 'tRNS') {
      trns = Buffer.from(data);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off = dataStart + len + 4; // skip data + CRC
  }

  if (interlace !== 0) throw new Error('interlaced PNGs are not supported');
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`unsupported color type ${colorType}`);

  const bitsPerPixel = channels * bitDepth;
  const bpp = Math.max(1, Math.ceil(bitsPerPixel / 8)); // for filtering
  const rowBytes = Math.ceil((width * bitsPerPixel) / 8);
  const out = unfilter(inflateSync(Buffer.concat(idatChunks)), width, height, rowBytes, bpp);

  const getPixel = makePixelAccessor({ out, rowBytes, bitDepth, colorType, channels, palette, trns });
  return { width, height, bitDepth, colorType, getPixel };
}

/** Reverses PNG scanline filtering into a flat byte buffer. */
function unfilter(raw, width, height, rowBytes, bpp) {
  const stride = rowBytes + 1; // + filter-type byte per row
  const out = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const inRow = raw.subarray(y * stride + 1, y * stride + 1 + rowBytes);
    const outRow = out.subarray(y * rowBytes, (y + 1) * rowBytes);
    const prevRow = y > 0 ? out.subarray((y - 1) * rowBytes, y * rowBytes) : null;
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? outRow[i - bpp] : 0;
      const b = prevRow ? prevRow[i] : 0;
      const c = prevRow && i >= bpp ? prevRow[i - bpp] : 0;
      let v = inRow[i];
      switch (filter) {
        case 0:
          break;
        case 1:
          v = (v + a) & 0xff;
          break;
        case 2:
          v = (v + b) & 0xff;
          break;
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
        default:
          throw new Error(`bad filter ${filter} on row ${y}`);
      }
      outRow[i] = v;
    }
  }
  return out;
}

/** Builds an `(x, y) => { r, g, b, a }` accessor for the decoded buffer. */
function makePixelAccessor({ out, rowBytes, bitDepth, colorType, channels, palette, trns }) {
  const paletteAlpha = colorType === 3 ? (idx) => (trns && idx < trns.length ? trns[idx] : 255) : null;

  // Sub-byte packing only occurs for single-channel types (grayscale, palette).
  if (bitDepth < 8) {
    const ppb = 8 / bitDepth;
    const maxv = (1 << bitDepth) - 1;
    return (x, y) => {
      const byte = out[y * rowBytes + Math.floor(x / ppb)];
      const shift = (ppb - 1 - (x % ppb)) * bitDepth;
      const v = (byte >> shift) & maxv;
      if (colorType === 3) {
        const p = palette?.[v] ?? { r: 0, g: 0, b: 0 };
        return { r: p.r, g: p.g, b: p.b, a: paletteAlpha(v) };
      }
      const g = Math.round((v / maxv) * 255);
      return { r: g, g, b: g, a: 255 };
    };
  }

  const bpc = bitDepth === 16 ? 2 : 1; // bytes per channel (take high byte @16)
  const stridePx = channels * bpc;
  return (x, y) => {
    const o = y * rowBytes + x * stridePx;
    const ch = (k) => out[o + k * bpc];
    switch (colorType) {
      case 0: {
        const g = ch(0);
        return { r: g, g, b: g, a: 255 };
      }
      case 2:
        return { r: ch(0), g: ch(1), b: ch(2), a: 255 };
      case 3: {
        const idx = ch(0);
        const p = palette[idx];
        return { r: p.r, g: p.g, b: p.b, a: paletteAlpha(idx) };
      }
      case 4: {
        const g = ch(0);
        return { r: g, g, b: g, a: ch(1) };
      }
      default: {
        return { r: ch(0), g: ch(1), b: ch(2), a: ch(3) };
      }
    }
  };
}

/* ------------------------------------------------------------------ */
/*  Measuring                                                          */
/* ------------------------------------------------------------------ */

/**
 * Scans each glyph cell for its horizontal ink bounds and returns a
 * `{ [char]: { l, w } }` table in native px.
 */
function measure({ sheet, cols, charW, charH, charset, alphaThreshold, colorThreshold }) {
  const { width, height, colorType, getPixel } = decodePng(readFileSync(sheet));
  console.error(`decoded ${sheet}: ${width}x${height} colorType=${colorType}`);

  const hasAlpha = colorType === 4 || colorType === 6 || colorType === 3;
  const bg = getPixel(0, 0); // corner pixel = assumed background for opaque sheets
  const isInk = hasAlpha
    ? (x, y) => getPixel(x, y).a > alphaThreshold
    : (x, y) => {
        const p = getPixel(x, y);
        return Math.abs(p.r - bg.r) + Math.abs(p.g - bg.g) + Math.abs(p.b - bg.b) > colorThreshold;
      };

  const metrics = {};
  for (let i = 0; i < charset.length; i++) {
    const char = charset[i];
    const x0 = (i % cols) * charW;
    const y0 = Math.floor(i / cols) * charH;
    let minX = charW;
    let maxX = -1;
    for (let dy = 0; dy < charH; dy++) {
      for (let dx = 0; dx < charW; dx++) {
        if (isInk(x0 + dx, y0 + dy)) {
          if (dx < minX) minX = dx;
          if (dx > maxX) maxX = dx;
        }
      }
    }
    metrics[char] = maxX < 0 ? { l: 0, w: charW } : { l: minX, w: maxX - minX + 1 };
  }
  return metrics;
}

/** Picks the most common `{ l, w }` pair — the sane default the font should use. */
function detectDefault(metrics, charset) {
  const counts = new Map(); // "l,w" -> { metric, count }
  for (const c of charset) {
    const m = metrics[c];
    const k = `${m.l},${m.w}`;
    const entry = counts.get(k) ?? { metric: m, count: 0 };
    entry.count++;
    counts.set(k, entry);
  }
  let best = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best; // { metric, count }
}

/**
 * Emits ready-to-paste TS: a DEFAULT literal plus an overrides-only object
 * (glyphs that differ from the default), grouped by sprite row.
 */
function formatLiteral(metrics, charset, cols, def) {
  const key = (c) => (/[A-Za-z_$]/.test(c) ? c : JSON.stringify(c));
  const isDefault = (c) => metrics[c].l === def.l && metrics[c].w === def.w;

  const rows = [];
  for (let r = 0; r < charset.length; r += cols) {
    const chunk = charset
      .slice(r, r + cols)
      .split('')
      .filter((c) => !isDefault(c)) // outliers only
      .map((c) => `${key(c)}: { l: ${metrics[c].l}, w: ${metrics[c].w} }`)
      .join(', ');
    if (chunk) rows.push('  ' + chunk + ',');
  }

  const defaultLiteral = `const DEFAULT = { l: ${def.l}, w: ${def.w} };`;
  const overrides = rows.length ? '{\n' + rows.join('\n') + '\n}' : '{}';
  return `${defaultLiteral}\n\n// Overrides (glyphs that differ from DEFAULT):\n${overrides}`;
}

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

/** Parses `key value` / `--key value` argv into a preset key + flag overrides. */
function parseArgs(argv) {
  let preset = null;
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      flags[arg.slice(2)] = argv[++i];
    } else if (preset === null) {
      preset = arg;
    }
  }
  return { preset, flags };
}

function main() {
  const { preset, flags } = parseArgs(process.argv.slice(2));
  const base = preset ? FONTS[preset] : {};
  if (preset && !base) {
    console.error(`unknown preset "${preset}". Available: ${Object.keys(FONTS).join(', ') || '(none)'}`);
    process.exit(1);
  }

  const config = {
    sheet: flags.sheet ?? base.sheet,
    cols: Number(flags.cols ?? base.cols),
    charW: Number(flags['char-w'] ?? base.charW),
    charH: Number(flags['char-h'] ?? base.charH),
    charset: flags.charset ?? base.charset,
    alphaThreshold: Number(flags['alpha-threshold'] ?? DEFAULT_ALPHA_THRESHOLD),
    colorThreshold: Number(flags['color-threshold'] ?? DEFAULT_COLOR_THRESHOLD),
  };

  const missing = ['sheet', 'cols', 'charW', 'charH', 'charset'].filter(
    (k) => config[k] === undefined || config[k] === '' || Number.isNaN(config[k]),
  );
  if (missing.length) {
    console.error(`missing/invalid: ${missing.join(', ')}`);
    console.error('Usage: node scripts/measure-bitmap-font.mjs <preset> | --sheet <png> --cols <n> --char-w <n> --char-h <n> --charset <str>');
    console.error(`Presets: ${Object.keys(FONTS).join(', ') || '(none)'}`);
    process.exit(1);
  }

  const metrics = measure(config);
  const def = detectDefault(metrics, config.charset);
  const overrideCount = config.charset.length - def.count;
  console.error(
    `default {l:${def.metric.l},w:${def.metric.w}} covers ${def.count}/${config.charset.length}; ${overrideCount} overrides`,
  );
  console.log(formatLiteral(metrics, config.charset, config.cols, def.metric));
}

main();
