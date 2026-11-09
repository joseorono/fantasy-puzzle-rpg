/**
 * Enemy battle sheets -> small animated FOE strips for the map.
 *
 * Battle sheets are large (the frog's is 6528x768); drawing them on the map would upload
 * them as textures and downscale every blit at a fractional, shimmering scale. This bakes
 * just the idle and move rows, cropped to their shared ink and downscaled once with
 * nearest-neighbour to the size of the enemy's existing `<slug>_map.png`, so the map
 * blits small cells 1:1.
 *
 *   1. `public/assets/enemy-sprites/<slug>_map_strip.png`  row 0 idle, row 1 move (if any)
 *   2. `src/constants/enemies/world-00/foe-map-strips.ts`  one `FoeMapStrip` per enemy
 *
 * The scale is `_map.png` width / idle frame 0 ink width (how `_map.png` itself was made),
 * and the anchor is frame 0's bottom centre, so frame 0 lands where `_map.png` did.
 *
 * Usage (Node 22 needs the flag to import the sheet consts):
 *   node --experimental-strip-types scripts/bake-foe-map-strips.mjs
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import sharp from 'sharp';
import { DINO_TRI_SHEET } from '../src/constants/enemies/world-00/dino-tri-sheet.ts';
import { FROGGER_SHEET } from '../src/constants/enemies/world-00/frogger-sheet.ts';
import { MONOPIXELART_SKELETON_SHEET } from '../src/constants/enemies/world-00/monopixelart-skeleton-sheet.ts';
import { RIDER_SHEET } from '../src/constants/enemies/world-00/rider-sheet.ts';
import { TECOPENA_BAT_SHEET } from '../src/constants/enemies/world-00/tecopena-bat-sheet.ts';
import { TECOPENA_SLIME_SHEET } from '../src/constants/enemies/world-00/tecopena-slime-sheet.ts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const OUT_TS = path.join(REPO_ROOT, 'src', 'constants', 'enemies', 'world-00', 'foe-map-strips.ts');

/** Alpha above this counts as ink, matching `admurin-enemy-to-sprite-sheet.mjs`. */
const INK_ALPHA = 8;

const SHEETS = [DINO_TRI_SHEET, FROGGER_SHEET, MONOPIXELART_SKELETON_SHEET, RIDER_SHEET, TECOPENA_BAT_SHEET, TECOPENA_SLIME_SHEET];

const toUpperSnake = (slug) => slug.replace(/[^a-z0-9]+/gi, '_').toUpperCase();
const publicFile = (url) => path.join(PUBLIC_DIR, ...url.split('/').filter(Boolean));

/** Ink bounds of the given frames of one sheet row, in cell coordinates; null when blank. */
function inkBounds(raw, sheetWidth, sheet, row, frames) {
  let minX = sheet.cellW;
  let minY = sheet.cellH;
  let maxX = -1;
  let maxY = -1;
  for (const frame of frames) {
    for (let y = 0; y < sheet.cellH; y += 1) {
      const rowStart = (row * sheet.cellH + y) * sheetWidth + frame * sheet.cellW;
      for (let x = 0; x < sheet.cellW; x += 1) {
        if (raw[(rowStart + x) * 4 + 3] > INK_ALPHA) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const range = (count) => Array.from({ length: count }, (_, index) => index);

function union(a, b) {
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

async function bakeStrip(sheet) {
  const sheetFile = publicFile(sheet.image);
  const slug = path.basename(sheet.image).replace(/_sheet\.png$/, '');
  const mapSpriteUrl = sheet.image.replace(/_sheet\.png$/, '_map.png');
  const stripUrl = sheet.image.replace(/_sheet\.png$/, '_map_strip.png');

  const { data: raw, info } = await sharp(sheetFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { idle, move } = sheet.animations;
  const rows = move ? [idle, move] : [idle];

  const firstFrame = inkBounds(raw, info.width, sheet, idle.row, [0]);
  if (!firstFrame) throw new Error(`${slug}: idle frame 0 is blank.`);
  const crop = rows
    .map((animation) => inkBounds(raw, info.width, sheet, animation.row, range(animation.frames)))
    .reduce((acc, bounds) => union(acc, bounds));

  const mapWidth = (await sharp(publicFile(mapSpriteUrl)).metadata()).width;
  const scale = mapWidth / firstFrame.width;
  const cellW = Math.max(1, Math.round(crop.width * scale));
  const cellH = Math.max(1, Math.round(crop.height * scale));
  const anchorX = Math.round((firstFrame.x + firstFrame.width / 2 - crop.x) * scale);
  const anchorY = Math.round((firstFrame.y + firstFrame.height - crop.y) * scale);

  const layers = [];
  for (const [stripRow, animation] of rows.entries()) {
    for (const frame of range(animation.frames)) {
      layers.push({
        input: await sharp(sheetFile)
          .extract({
            left: frame * sheet.cellW + crop.x,
            top: animation.row * sheet.cellH + crop.y,
            width: crop.width,
            height: crop.height,
          })
          .resize({ width: cellW, height: cellH, fit: 'fill', kernel: 'nearest' })
          .png()
          .toBuffer(),
        left: frame * cellW,
        top: stripRow * cellH,
      });
    }
  }
  const stripWidth = Math.max(...rows.map((animation) => animation.frames)) * cellW;
  const stripHeight = rows.length * cellH;
  const buffer = await sharp({
    create: { width: stripWidth, height: stripHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(publicFile(stripUrl), buffer);

  console.log(
    `${slug}: ${stripWidth}x${stripHeight} (${cellW}x${cellH} cells, scale ${scale.toFixed(3)}, ${buffer.length} bytes)`,
  );
  return { slug, stripUrl, cellW, cellH, anchorX, anchorY, idle, move };
}

const animationLiteral = (animation) =>
  `{ frames: ${animation.frames}, frameDurationMs: ${animation.frameDurationMs} }`;

function renderModule(strips) {
  const consts = strips.map(
    (strip) => `export const ${toUpperSnake(strip.slug)}_MAP_STRIP: FoeMapStrip = {
  image: '${strip.stripUrl}',
  cellW: ${strip.cellW},
  cellH: ${strip.cellH},
  anchorX: ${strip.anchorX},
  anchorY: ${strip.anchorY},
  idle: ${animationLiteral(strip.idle)},
  ${strip.move ? `move: ${animationLiteral(strip.move)},` : ''}
};`,
  );
  return `// Generated by scripts/bake-foe-map-strips.mjs — rerun it instead of editing.
import type { FoeMapStrip } from '~/types/foe';

${consts.join('\n\n')}
`;
}

const strips = [];
for (const sheet of SHEETS) strips.push(await bakeStrip(sheet));

const prettierOptions = {
  ...((await resolveConfig(path.join(REPO_ROOT, 'package.json'))) ?? {}),
  parser: 'typescript',
};
delete prettierOptions.plugins;
writeFileSync(OUT_TS, await format(renderModule(strips), prettierOptions));
console.log(`wrote ${path.relative(REPO_ROOT, OUT_TS)}`);
