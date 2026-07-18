/**
 * One-off metrics generator for the Narik bitmap fonts.
 *
 * The Narik sprite sheets are fixed-cell (15x25) monospace grids, but the
 * glyphs inside each cell have varying real widths. This script decodes a 1x
 * sheet, scans the opaque (ink) pixels in each cell, and emits a per-glyph
 * { l: leftBearing, w: inkWidth } table (in native px) that the renderer uses
 * for proportional layout.
 *
 * Both 1x sheets (Wood / RedWood) are byte-identical in geometry, so a single
 * table serves both fonts. Re-run this if the artist updates the sheet:
 *   node scripts/measure-narik-font.mjs
 *
 * Dependency-free: uses Node's built-in zlib to inflate the PNG IDAT.
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// Must match src/components/bitmap-fonts/narik-*.tsx CONFIG.
const CHARSET =
  'ABCDEFGHIJKL' +
  'MNOPQRSTUVWX' +
  'YZ1234567890' +
  'abcdefghijkl' +
  'mnopqrstuvwx' +
  'yz:';
const COLS = 12;
const CHAR_W = 15;
const CHAR_H = 25;
const ALPHA_THRESHOLD = 32; // palette-index alpha above this counts as ink

const SHEET = 'public/assets/fonts/Wood-narik.png';

/** Minimal PNG decoder for bitDepth 4 / colorType 3 (indexed) sheets. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let trns = null; // per-palette-index alpha
  const idatChunks = [];

  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const dataStart = off + 8;
    if (type === 'IHDR') {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
      bitDepth = buf[dataStart + 8];
      colorType = buf[dataStart + 9];
    } else if (type === 'tRNS') {
      trns = buf.subarray(dataStart, dataStart + len);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(dataStart, dataStart + len));
    } else if (type === 'IEND') {
      break;
    }
    off = dataStart + len + 4; // skip data + CRC
  }

  if (colorType !== 3 || bitDepth !== 4) {
    throw new Error(`unsupported PNG format: colorType=${colorType} bitDepth=${bitDepth}`);
  }

  const raw = inflateSync(Buffer.concat(idatChunks));

  // Unfilter. bitDepth 4 => bpp (bytes per pixel, for filtering) = 1.
  const bpp = 1;
  const rowBytes = Math.ceil((width * bitDepth) / 8); // 90 for 180px @ 4bpp
  const stride = rowBytes + 1; // + filter byte
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
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pred) & 0xff;
          break;
        }
        default:
          throw new Error(`bad filter ${filter} on row ${y}`);
      }
      outRow[i] = v;
    }
  }

  // Palette-index alpha lookup (indices without a tRNS entry are opaque).
  const alphaOf = (idx) => (trns && idx < trns.length ? trns[idx] : 255);

  /** Returns true if the pixel at (x, y) is ink (opaque enough). */
  const isInk = (x, y) => {
    const byte = out[y * rowBytes + (x >> 1)];
    const idx = x & 1 ? byte & 0x0f : byte >> 4; // high nibble = left pixel
    return alphaOf(idx) > ALPHA_THRESHOLD;
  };

  return { width, height, isInk };
}

const { width, height, isInk } = decodePng(readFileSync(SHEET));
console.error(`decoded ${SHEET}: ${width}x${height}`);

const metrics = {};
for (let i = 0; i < CHARSET.length; i++) {
  const char = CHARSET[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x0 = col * CHAR_W;
  const y0 = row * CHAR_H;

  let minX = CHAR_W;
  let maxX = -1;
  for (let dy = 0; dy < CHAR_H; dy++) {
    for (let dx = 0; dx < CHAR_W; dx++) {
      if (isInk(x0 + dx, y0 + dy)) {
        if (dx < minX) minX = dx;
        if (dx > maxX) maxX = dx;
      }
    }
  }

  if (maxX < 0) {
    metrics[char] = { l: 0, w: CHAR_W }; // empty cell, keep full width
  } else {
    metrics[char] = { l: minX, w: maxX - minX + 1 };
  }
}

// Emit a ready-to-paste TS object literal.
const rows = [];
for (let r = 0; r < CHARSET.length; r += COLS) {
  const chunk = CHARSET.slice(r, r + COLS)
    .split('')
    .map((c) => {
      const m = metrics[c];
      const key = c === ':' || c === "'" || c === '\\' ? JSON.stringify(c) : `'${c}'`;
      return `${key}: { l: ${m.l}, w: ${m.w} }`;
    })
    .join(', ');
  rows.push('  ' + chunk + ',');
}
console.log('{\n' + rows.join('\n') + '\n}');
