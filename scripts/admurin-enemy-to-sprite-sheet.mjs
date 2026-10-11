/**
 * Admurin monster pack -> combined enemy sprite sheet + generated TS.
 *
 * Admurin packs ship one horizontal strip per animation (`badger_idle.png`,
 * `badger_attack_A.png`, …), all cells square. Battle enemies, though, render from a single
 * combined sheet whose animations stack as rows. This script does the merge and writes the
 * data the render stack reads:
 *
 *   1. `public/assets/enemy-sprites/<slug>_sheet.png`  rows stacked top to bottom
 *   2. `<out>/<slug>.ts`                               `AdmurinEnemySheet` + an `EnemyData` template
 *      (`--sheet-only` instead writes `<out>/<slug>-sheet.ts` with just the sheet, for
 *      re-skinning an enemy that already exists)
 *
 * Rows are assigned in canonical order — idle, move, hurt, attacks, ability — and each pack
 * strip is matched to a slot by its lowercased filename suffix. The vocabulary is small and
 * explicit (see VOCABULARY); an unknown suffix is a hard error, and `--anim` forces a file
 * into a slot when the pack invents a name we do not know yet.
 *
 * Admurin mixes frame sizes: the idle strip uses 128px-wide frames while every other animation
 * uses 384px-wide ones, so the frame width is DETECTED per strip (see detectFrameWidth) and every
 * frame is pasted centred into one uniform cell. Assuming a square 128 grid — as this script
 * first did — slices drawings in half and fills half the "frames" with blanks.
 *
 * The combined sheet is written already compressed — this script does NOT run the repo-wide
 * images optimizer, so the PNG that lands in `public/` is the one that ships.
 *
 * Usage:
 *   node scripts/admurin-enemy-to-sprite-sheet.mjs context/Badger
 *   node scripts/admurin-enemy-to-sprite-sheet.mjs context/Badger --attack-b heavy --write
 *   node scripts/admurin-enemy-to-sprite-sheet.mjs context/Frogger --sheet-only --attack-b fast --write
 *   node scripts/admurin-enemy-to-sprite-sheet.mjs public/assets/enemy-sprites/badger_sheet.png --cell 128
 *
 * Flags:
 *   --cell <px>           Force the frame width (folder mode) or the square cell size (PNG mode).
 *                         Default: detected per strip (Admurin mixes 128px idle and 384px rest).
 *   --out <dir>           Output root for the generated TS. Default: src/constants/enemies/world-00.
 *   --id <slug>           Enemy id/slug. Default: kebab-case of the pack folder name.
 *   --name <text>         Enemy display name. Default: Title Case of the id.
 *   --anim <slot>=<name>  Force the strip whose suffix keyword is <name> into <slot>
 *                         (slot ∈ idle|move|hurt|attack1|attack2|ability). Repeatable.
 *   --attack-b fast|heavy Preset for the second attack in the generated enemy template.
 *                         Default: heavy.
 *   --sheet-only          Emit only the sheet constant (for re-skinning an existing enemy).
 *   --map-sprite <px>     Also write the overworld FOE sprite (`<slug>_map.png`): the idle pose
 *                         cropped to its ink and downscaled to <px> wide, nearest-neighbour.
 *   --write               Write files. Default is a dry run that prints the plan.
 *
 * The wiring is deliberately NOT automated — the script prints the `assetList` line for
 * `src/services/assets-service.ts` and, in full mode, the import/export line for
 * `src/constants/enemies/world-00/index.ts` so they stay reviewable.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import sharp from 'sharp';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Where the sheet PNG lives on disk and where the browser fetches it from. */
const SHEET_OUT_DIR = path.join('public', 'assets', 'enemy-sprites');
const SHEET_URL_DIR = 'assets/enemy-sprites';

/** How long each frame of a slot is shown, in ms. Attacks snap; idle breathes. */
const FRAME_DURATION_MS = {
  idle: 140,
  move: 80,
  hurt: 80,
  attack1: 70,
  attack2: 70,
  ability: 80,
};

/** Fraction of the card left empty around the sprite, mirroring `ADMURIN_CARD_PADDING` in the app. */
const ADMURIN_CARD_PADDING = 0.08;

/** Lowercased filename suffix -> sheet slot. `attacks` rows are ordered by ATTACK_ORDER. */
const VOCABULARY = {
  idle: 'idle',
  move: 'move',
  hurt: 'hurt',
  attack_a: 'attacks',
  attack_b: 'attacks',
  tongue: 'attacks',
  spit: 'attacks',
  stomp: 'attacks',
  ability: 'ability',
  heal: 'ability',
  skill: 'ability',
};

/** Attack keywords in the order combat should play them. */
const ATTACK_ORDER = ['attack_a', 'attack_b', 'tongue', 'spit', 'stomp'];

/** Canonical row order; only present slots get a row, assigned sequentially in this order. */
const CANONICAL_SLOTS = ['idle', 'move', 'hurt', 'attack1', 'attack2', 'ability'];

const ANIM_SLOTS = new Set(['idle', 'move', 'hurt', 'attack1', 'attack2', 'ability']);

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    source: null,
    cell: null,
    out: path.join('src', 'constants', 'enemies', 'world-00'),
    id: null,
    name: null,
    anim: [],
    attackB: 'heavy',
    sheetOnly: false,
    mapSprite: null,
    write: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--sheet-only') opts.sheetOnly = true;
    else if (arg === '--map-sprite') opts.mapSprite = Number(argv[++i]);
    else if (arg === '--cell') opts.cell = Number(argv[++i]);
    else if (arg === '--out') opts.out = argv[++i];
    else if (arg === '--id') opts.id = argv[++i];
    else if (arg === '--name') opts.name = argv[++i];
    else if (arg === '--anim') opts.anim.push(argv[++i]);
    else if (arg === '--attack-b') opts.attackB = argv[++i];
    else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    else if (!opts.source) opts.source = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!opts.source) {
    throw new Error('Usage: node scripts/admurin-enemy-to-sprite-sheet.mjs <pack-folder|sheet.png> [--write]');
  }
  if (opts.cell !== null && !(Number.isInteger(opts.cell) && opts.cell > 0)) {
    throw new Error('--cell expects a positive whole number of pixels, e.g. --cell 128');
  }
  if (opts.attackB !== 'fast' && opts.attackB !== 'heavy') {
    throw new Error(`--attack-b expects fast or heavy, got "${opts.attackB}"`);
  }
  if (opts.mapSprite !== null && !(Number.isInteger(opts.mapSprite) && opts.mapSprite > 0)) {
    throw new Error('--map-sprite expects a positive whole number of pixels, e.g. --map-sprite 40');
  }

  opts.anim = opts.anim.map((entry) => {
    const [slot, keyword] = entry.split('=');
    if (!slot || !keyword) throw new Error(`--anim expects <slot>=<name>, got "${entry}"`);
    if (!ANIM_SLOTS.has(slot)) {
      throw new Error(`--anim slot must be one of ${[...ANIM_SLOTS].join(', ')}, got "${slot}"`);
    }
    return { slot, keyword: keyword.toLowerCase() };
  });

  return opts;
}

/* ------------------------------------------------------------------ */
/*  Naming                                                             */
/* ------------------------------------------------------------------ */

const toKebab = (value) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const toUpperSnake = (value) => toKebab(value).replace(/-/g, '_').toUpperCase();

/** `attack_a` -> `Attack A`; `idle` -> `Idle`. */
const toTitleCase = (value) =>
  value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

/* ------------------------------------------------------------------ */
/*  Slot detection                                                     */
/* ------------------------------------------------------------------ */

/**
 * The animation keyword a strip filename carries: everything after the pack prefix
 * (`badger_attack_A` in the `Badger` pack -> `attack_A`). Falls back to everything after the
 * first underscore when the filename does not carry the pack prefix. Casing is preserved so the
 * generated `source` stays an exact audit trail; lookups lowercase it.
 */
function stripKeyword(fileName, packPrefix) {
  const base = fileName.replace(/\.[^.]+$/, '');
  const lower = base.toLowerCase();
  if (lower.startsWith(packPrefix)) return base.slice(packPrefix.length);
  const underscore = lower.indexOf('_');
  return underscore === -1 ? base : base.slice(underscore + 1);
}

/** The slot bucket a strip belongs to, honoring `--anim` overrides before the vocabulary. */
function resolveSlot(keyword, overrides) {
  const lower = keyword.toLowerCase();
  const forced = overrides.find((entry) => entry.keyword === lower);
  if (forced) return forced.slot === 'attack1' || forced.slot === 'attack2' ? 'attacks' : forced.slot;
  return VOCABULARY[lower] ?? null;
}

/** Where an attack row sorts: known keywords first, in declared order. */
function attackSortKey(entry, overrides) {
  const lower = entry.keyword.toLowerCase();
  const forced = overrides.find((o) => o.keyword === lower);
  if (forced?.slot === 'attack1') return 0;
  if (forced?.slot === 'attack2') return 1;
  const known = ATTACK_ORDER.indexOf(lower);
  return known === -1 ? 100 : known;
}

/** Reads the pack folder into slot buckets, or dies naming the offenders and the fix. */
function collectFolderStrips(folder, overrides) {
  const pack = path.basename(folder);
  const packPrefix = `${toKebab(pack)}_`;
  const files = readdirSync(folder)
    .filter((name) => /\.png$/i.test(name) && !name.startsWith('_'))
    .sort();
  if (files.length === 0) throw new Error(`No *.png strips in ${folder} (files starting with _ are ignored).`);

  const slots = { idle: null, move: null, hurt: null, attacks: [], ability: null };
  const unknown = [];

  for (const file of files) {
    const keyword = stripKeyword(file, packPrefix);
    const slot = resolveSlot(keyword, overrides);
    if (!slot) {
      unknown.push({ file, keyword });
      continue;
    }
    const entry = { keyword, file: path.join(folder, file) };
    if (slot === 'attacks') slots.attacks.push(entry);
    else slots[slot] = entry;
  }

  if (unknown.length > 0) {
    throw new Error(
      `Unknown animation suffix: ${unknown.map((u) => `"${u.keyword}" (${u.file})`).join(', ')}.\n` +
        `  Known names: ${Object.keys(VOCABULARY).join(', ')}.\n` +
        `  Map it explicitly with --anim <slot>=<keyword>, e.g. --anim ability=${unknown[0].keyword}`,
    );
  }

  slots.attacks.sort(
    (a, b) => attackSortKey(a, overrides) - attackSortKey(b, overrides) || a.file.localeCompare(b.file),
  );
  return slots;
}

/** Builds the ordered row list (row = index) from the slot buckets. */
function buildRows(slots) {
  const rows = [];
  const push = (slotKey, entry, durationSlot) => {
    if (entry) rows.push({ slotKey, keyword: entry.keyword, file: entry.file, durationSlot });
  };
  push('idle', slots.idle, 'idle');
  push('move', slots.move, 'move');
  push('hurt', slots.hurt, 'hurt');
  slots.attacks.forEach((entry, index) => push('attacks', entry, index === 0 ? 'attack1' : 'attack2'));
  push('ability', slots.ability, 'ability');
  return rows;
}

/* ------------------------------------------------------------------ */
/*  Frame geometry                                                     */
/* ------------------------------------------------------------------ */

/** Which columns of a strip hold ink, so frame edges can be found without guessing. */
async function columnInk(file, width, height) {
  const raw = await sharp(file).ensureAlpha().raw().toBuffer();
  const ink = new Uint8Array(width);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (raw[(y * width + x) * 4 + 3] > 8) {
        ink[x] = 1;
        break;
      }
    }
  }
  return ink;
}

/** Maximal inked column runs, as [start, end] pairs. */
function inkRuns(ink) {
  const runs = [];
  let start = -1;
  for (let x = 0; x < ink.length; x += 1) {
    if (ink[x] && start === -1) start = x;
    const last = x === ink.length - 1;
    if (start !== -1 && (!ink[x] || last)) {
      runs.push([start, ink[x] ? x : x - 1]);
      start = -1;
    }
  }
  return runs;
}

/**
 * A strip's true frame width: the smallest divisor of the strip width where no drawing crosses a
 * frame edge and no frame comes out empty. That is exactly what a blanket 128px assumption gets
 * wrong — `badger_attack_A` reads as 15 frames, not 45, and its hurt as 4, not 12.
 */
function detectFrameWidth(width, ink) {
  const runs = inkRuns(ink);
  if (runs.length === 0) return null;
  const widestRun = Math.max(...runs.map(([start, end]) => end - start + 1));

  for (let frameW = Math.max(16, widestRun); frameW <= width; frameW += 1) {
    if (width % frameW !== 0) continue;
    if (runs.some(([start, end]) => Math.floor(start / frameW) !== Math.floor(end / frameW))) continue;
    let isEmpty = false;
    for (let frame = 0; frame < width / frameW && !isEmpty; frame += 1) {
      let hasInk = false;
      for (let x = frame * frameW; x < (frame + 1) * frameW && !hasInk; x += 1) hasInk = ink[x] === 1;
      isEmpty = !hasInk;
    }
    if (!isEmpty) return frameW;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Measurement + compositing                                          */
/* ------------------------------------------------------------------ */

/** One present row with its measured geometry and detected frame width. */
async function measureRow(row) {
  const meta = await sharp(row.file).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const ink = await columnInk(row.file, width, height);
  const frameW = detectFrameWidth(width, ink);
  if (!frameW) {
    throw new Error(
      `${row.file}: could not find a frame width (a drawing would cross every frame edge, or a frame is blank). Pass --cell to force one.`,
    );
  }
  return {
    ...row,
    file: row.file,
    width,
    height,
    frameW,
    frames: width / frameW,
    frameDurationMs: FRAME_DURATION_MS[row.durationSlot],
  };
}

/**
 * Ink bounds of one row's frames, in the coordinates of ONE cell (frames sit in different cells,
 * so the union is measured frame-local and offset once). Each animation's rect is what the card
 * must fit — the frog's tongue reaches far past its body, and it has to stay visible.
 */
async function measureRowRect(row, cellH, frameOffset) {
  const raw = await sharp(row.file).ensureAlpha().raw().toBuffer();
  const stripWidth = row.width;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let frame = 0; frame < row.frames; frame += 1) {
    for (let y = 0; y < cellH; y += 1) {
      for (let x = 0; x < row.frameW; x += 1) {
        if (raw[(y * stripWidth + frame * row.frameW + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  return { x: frameOffset + minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Frame offset inside the cell — every source frame is centred so the drawing never shifts. */
const cellOffset = (cellW, frameW) => Math.floor((cellW - frameW) / 2);

/**
 * The overworld FOE sprite: one frame cropped to its ink and downscaled to `width` px with
 * nearest-neighbour, so the map keeps crisp pixels (what `scripts/recolor-sprite.py` did for the
 * stone golem). The map draws it at its natural size, feet on the ground.
 */
async function buildMapSprite(row, frameIndex, width) {
  const raw = await sharp(row.file).ensureAlpha().raw().toBuffer();
  const stripWidth = row.width;
  let minX = row.frameW;
  let minY = row.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < row.height; y += 1) {
    for (let x = 0; x < row.frameW; x += 1) {
      if (raw[(y * stripWidth + frameIndex * row.frameW + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${row.file}: frame ${frameIndex} is blank, cannot build a map sprite.`);

  return sharp(row.file)
    .extract({ left: frameIndex * row.frameW + minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize({ width, kernel: 'nearest' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Every frame must carry ink: a blank one is the symptom of frames sliced at the wrong width (or a
 * window that missed the body), and it reaches the player as flickering, so this fails the run.
 */
async function assertFramesVisible(rows) {
  for (const row of rows) {
    const raw = await sharp(row.file).ensureAlpha().raw().toBuffer();
    for (let frame = 0; frame < row.frames; frame += 1) {
      let ink = 0;
      for (let y = 0; y < row.height && ink === 0; y += 1) {
        for (let x = 0; x < row.frameW && ink === 0; x += 1) {
          if (raw[(y * row.width + frame * row.frameW + x) * 4 + 3] > 8) ink += 1;
        }
      }
      if (ink === 0) {
        throw new Error(`${row.file}: frame ${frame} is blank — the frame width is probably wrong.`);
      }
    }
  }
}

/** Composites every frame into one uniform-cell sheet, in row order. */
async function compositeSheet(rows, cellW, cellH) {
  const layers = [];
  for (const row of rows) {
    const offset = cellOffset(cellW, row.frameW);
    for (let frame = 0; frame < row.frames; frame += 1) {
      layers.push({
        input: await sharp(row.file)
          .extract({ left: frame * row.frameW, top: 0, width: row.frameW, height: cellH })
          .png()
          .toBuffer(),
        top: row.row * cellH,
        left: frame * cellW + offset,
      });
    }
  }
  const sheetWidth = Math.max(...rows.map((row) => row.frames * cellW));
  const sheetHeight = rows.length * cellH;
  const buffer = await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { buffer, sheetWidth, sheetHeight };
}

/* ------------------------------------------------------------------ */
/*  Code generation                                                    */
/* ------------------------------------------------------------------ */

const animLine = (slot, row) =>
  `    ${slot}: { row: ${row.row}, frames: ${row.frames}, frameDurationMs: ${row.frameDurationMs}, source: '${row.keyword}', rect: { x: ${row.rect.x}, y: ${row.rect.y}, width: ${row.rect.width}, height: ${row.rect.height} } },`;

function renderSheetConstant(constName, sheet) {
  const lines = [`export const ${constName}: AdmurinEnemySheet = {`];
  lines.push(`  image: '${sheet.image}',`);
  lines.push(`  cellW: ${sheet.cellW},`);
  lines.push(`  cellH: ${sheet.cellH},`);
  lines.push(`  animations: {`);
  for (const slot of ['idle', 'move', 'hurt']) {
    const row = sheet.rows.find((entry) => entry.slotKey === slot);
    if (row) lines.push(animLine(slot, row));
  }
  const attacks = sheet.rows.filter((row) => row.slotKey === 'attacks');
  if (attacks.length > 0) {
    lines.push(`    attacks: [`);
    for (const row of attacks) {
      lines.push(
        `      { row: ${row.row}, frames: ${row.frames}, frameDurationMs: ${row.frameDurationMs}, source: '${row.keyword}', rect: { x: ${row.rect.x}, y: ${row.rect.y}, width: ${row.rect.width}, height: ${row.rect.height} } },`,
      );
    }
    lines.push(`    ],`);
  }
  const ability = sheet.rows.find((row) => row.slotKey === 'ability');
  if (ability) lines.push(animLine('ability', ability));
  lines.push(`  },`);
  lines.push(`};`);
  return lines.join('\n');
}

function renderEnemyAttacks(attackRows, preset) {
  if (attackRows.length === 0) return null;
  const lines = ['  attacks: ['];
  lines.push(`    { name: '${toTitleCase(attackRows[0].keyword)}', damageMultiplier: 1 },`);
  if (attackRows.length > 1) {
    const name = toTitleCase(attackRows[1].keyword);
    if (preset === 'fast') {
      lines.push(
        `    { name: '${name}', intervalMultiplier: 0.6, damageMultiplier: 0.75, guardBreakMultiplier: 0.8 },`,
      );
    } else {
      lines.push(`    { name: '${name}', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },`);
    }
  }
  lines.push('  ],');
  return lines.join('\n');
}

function renderEnemyTemplate({ slug, name, sheetConst, enemyConst, hpConst, sheet, preset }) {
  const attackRows = sheet.rows.filter((row) => row.slotKey === 'attacks');
  const spriteSize = sheet.cellW >= 128 ? 'xl' : 'md';
  const lines = [
    `// HP is pulled out so \`expReward\` can be derived from it — see \`calculateEnemyExpReward\`.`,
    `const ${hpConst} = calculateMaxHp(50, 40, 5); // TODO tune`,
    ``,
    `export const ${enemyConst}: EnemyData = {`,
    `  id: '${slug}',`,
    `  name: '${name}',`,
    `  type: 'beast',`,
    `  stats: { pow: 10, vit: 40, spd: 0 }, // TODO tune`,
    `  vitHpMultiplier: 5, // TODO tune`,
    `  maxHp: ${hpConst},`,
    `  currentHp: 0, // Set to maxHp below, after the literal.`,
    `  sprite: '${sheet.image}',`,
    `  admurinSheet: ${sheetConst},`,
    `  spriteSize: '${spriteSize}',`,
    `  attackInterval: 4000, // TODO tune`,
    `  attackDamage: 24, // TODO tune`,
    `  guardBreak: 1, // TODO tune`,
    `  poise: 1, // TODO tune`,
    `  rarityBias: 0, // TODO tune`,
    `  expReward: calculateEnemyExpReward(${hpConst}),`,
    `  lootTable: createEmptyLootTable(),`,
  ];
  const attacks = renderEnemyAttacks(attackRows, preset);
  if (attacks) lines.push(attacks);
  lines.push(`};`);
  lines.push(``);
  lines.push(`${enemyConst}.currentHp = ${enemyConst}.maxHp;`);
  return lines.join('\n');
}

function renderModule({ sheetOnly, sheetConst, enemyConst, hpConst, slug, name, sheet, preset }) {
  if (sheetOnly) {
    return [
      `import type { AdmurinEnemySheet } from '~/types/admurin-enemies';`,
      ``,
      renderSheetConstant(sheetConst, sheet),
      ``,
    ].join('\n');
  }
  return [
    `import type { AdmurinEnemySheet } from '~/types/admurin-enemies';`,
    `import type { EnemyData } from '~/types/rpg-elements';`,
    `import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';`,
    `import { createEmptyLootTable } from '~/types/loot';`,
    ``,
    renderSheetConstant(sheetConst, sheet),
    ``,
    renderEnemyTemplate({ slug, name, sheetConst, enemyConst, hpConst, sheet, preset }),
    ``,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const sourcePath = path.resolve(REPO_ROOT, opts.source);
  if (!existsSync(sourcePath)) throw new Error(`Source not found: ${opts.source}`);
  const isFolder = statSync(sourcePath).isDirectory();

  const packName = isFolder ? path.basename(sourcePath) : path.basename(sourcePath, path.extname(sourcePath));
  const slug = toKebab(opts.id ?? packName);
  const name = opts.name ?? toTitleCase(slug);

  const rel = (file) => path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const sheetImage = `/${SHEET_URL_DIR}/${slug}_sheet.png`;
  const sheetFile = path.join(REPO_ROOT, SHEET_OUT_DIR, `${slug}_sheet.png`);
  const outDir = path.resolve(REPO_ROOT, opts.out);
  const tsFile = path.join(outDir, opts.sheetOnly ? `${slug}-sheet.ts` : `${slug}.ts`);

  let rows;
  let cellW;
  let cellH;
  let sheetWidth;
  let sheetHeight;
  let sheetBuffer = null;

  if (isFolder) {
    const slots = collectFolderStrips(sourcePath, opts.anim);
    const order = buildRows(slots);
    if (order.length === 0) throw new Error(`No recognizable animations in ${opts.source}.`);

    // Every strip shares one height; each strip's frame WIDTH is detected (Admurin mixes 128 and 384).
    const measured = await Promise.all(order.map(measureRow));
    const heights = new Set(measured.map((row) => row.height));
    if (heights.size > 1) {
      throw new Error(
        `All strips must share one height; found ${[...heights].sort((a, b) => a - b).join(', ')} in ${opts.source}.`,
      );
    }
    cellH = [...heights][0];

    if (opts.cell) {
      for (const row of measured) {
        if (row.width % opts.cell !== 0) {
          throw new Error(`--cell ${opts.cell} does not divide ${row.file} (${row.width}px).`);
        }
        row.frameW = opts.cell;
        row.frames = row.width / opts.cell;
      }
    }
    cellW = Math.max(...measured.map((row) => row.frameW));

    rows = measured.map((row, index) => ({ ...row, row: index }));
    const composed = await compositeSheet(rows, cellW, cellH);
    sheetBuffer = composed.buffer;
    sheetWidth = composed.sheetWidth;
    sheetHeight = composed.sheetHeight;

    for (const row of rows) {
      row.rect = await measureRowRect(row, cellH, cellOffset(cellW, row.frameW));
    }
  } else {
    const meta = await sharp(sourcePath).metadata();
    const imageWidth = meta.width ?? 0;
    const imageHeight = meta.height ?? 0;
    cellW = opts.cell ?? imageHeight / 6;
    if (!Number.isInteger(cellW) || cellW <= 0) {
      throw new Error(`PNG mode needs --cell: ${imageHeight}px height is not a whole number of default 6 rows.`);
    }
    cellH = cellW;
    const rowCount = imageHeight / cellH;
    if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > CANONICAL_SLOTS.length) {
      throw new Error(
        `PNG mode: ${imageHeight}px / ${cellH}px = ${rowCount} rows; expected 1–${CANONICAL_SLOTS.length}.`,
      );
    }
    if (imageWidth % cellW !== 0) {
      throw new Error(`PNG mode: width ${imageWidth}px is not a whole number of ${cellW}px cells.`);
    }
    rows = CANONICAL_SLOTS.slice(0, rowCount).map((slotKey, index) => ({
      slotKey,
      keyword: slotKey,
      durationSlot: slotKey,
      row: index,
      file: sourcePath,
      width: imageWidth,
      height: cellH,
      frameW: cellW,
      frames: imageWidth / cellW,
      frameDurationMs: FRAME_DURATION_MS[slotKey],
    }));
    sheetWidth = imageWidth;
    sheetHeight = imageHeight;
    for (const row of rows) {
      row.rect = await measureRowRect(row, cellH, 0);
    }
  }

  const sheet = { image: sheetImage, cellW, cellH, rows };
  await assertFramesVisible(rows);
  const sheetConst = `${toUpperSnake(slug)}_SHEET`;
  const enemyConst = toUpperSnake(slug);
  const hpConst = `${toUpperSnake(slug)}_MAX_HP`;

  const prettierOptions = {
    ...((await resolveConfig(path.join(REPO_ROOT, 'package.json'))) ?? {}),
    parser: 'typescript',
  };
  delete prettierOptions.plugins; // only the tailwind class sorter; irrelevant to these files
  const tsSource = await format(
    renderModule({
      sheetOnly: opts.sheetOnly,
      sheetConst,
      enemyConst,
      hpConst,
      slug,
      name,
      sheet,
      preset: opts.attackB,
    }),
    prettierOptions,
  );

  /* ---- report ---- */
  console.log(`source:   ${rel(sourcePath)}  (${isFolder ? 'pack folder' : 'combined PNG'})`);
  console.log(`slug:     ${slug}  "${name}"${opts.id ? '' : ' (id from folder name)'}`);
  console.log(`cell:     ${cellW}×${cellH} px${isFolder ? '' : ` (${opts.cell ? '--cell' : 'height ÷ 6'})`}`);
  console.log(`sheet:    ${sheetWidth}×${sheetHeight} px  (${rows.length} row(s))`);
  const idleRow = rows.find((row) => row.slotKey === 'idle') ?? rows[0];
  console.log(
    `body:     idle ${idleRow.rect.width}×${idleRow.rect.height} px — the card fits each animation with ${Math.round(ADMURIN_CARD_PADDING * 100)}% padding`,
  );
  console.log(`window:   every frame carries ink and fits the card ✓`);
  console.log(`mapping:`);
  for (const row of rows) {
    console.log(
      `  ${String(row.row).padEnd(5)} ${row.slotKey.padEnd(8)} ${String(row.frameW).padStart(3)}px  ` +
        `${String(row.frames).padStart(3)} frames  ${String(row.frameDurationMs).padStart(3)}ms  ` +
        `${row.keyword}  <- ${rel(row.file)}`,
    );
  }
  if (opts.sheetOnly) console.log(`enemy:    --sheet-only (no EnemyData template)`);
  else if (rows.some((row) => row.slotKey === 'attacks')) console.log(`attack B: ${opts.attackB} preset`);
  console.log(`mode:     ${opts.write ? 'WRITE' : 'dry run (pass --write to apply)'}\n`);

  const label = opts.write ? 'ok    ' : 'would ';
  if (isFolder) console.log(`  ${label} write ${rel(sheetFile)}  (${sheetWidth}×${sheetHeight}, ${rows.length} rows)`);
  else if (sourcePath === sheetFile) console.log(`  keep   ${rel(sheetFile)}  (source is already the sheet)`);
  else console.log(`  ${label} write ${rel(sheetFile)}  (copy of the source PNG)`);
  console.log(`  ${label} write ${rel(tsFile)}`);

  // The FOE sprite is the neutral idle pose — the map draws one static frame, so a mid-stride
  // walk frame would just look frozen mid-step (the repo's stone golem sprite is an idle too).
  const mapSpriteRow = opts.mapSprite ? (rows.find((row) => row.slotKey === 'idle') ?? rows[0]) : null;
  const mapSpriteFrame = 0;
  const mapSpriteFile = path.join(REPO_ROOT, SHEET_OUT_DIR, `${slug}_map.png`);
  const mapSpriteBuffer = mapSpriteRow ? await buildMapSprite(mapSpriteRow, mapSpriteFrame, opts.mapSprite) : null;
  if (mapSpriteRow) {
    console.log(
      `  ${label} write ${rel(mapSpriteFile)}  (${opts.mapSprite}px wide, ${mapSpriteRow.keyword} frame ${mapSpriteFrame})`,
    );
  }

  if (opts.write) {
    mkdirSync(path.dirname(sheetFile), { recursive: true });
    if (isFolder) writeFileSync(sheetFile, sheetBuffer);
    else if (sourcePath !== sheetFile) copyFileSync(sourcePath, sheetFile);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(tsFile, tsSource);
    if (mapSpriteBuffer) writeFileSync(mapSpriteFile, mapSpriteBuffer);
  }

  /* ---- the wiring the script leaves to you ---- */
  console.log(`\nStill to wire up by hand:`);
  console.log(`  ${rel(path.join(REPO_ROOT, 'src', 'services', 'assets-service.ts'))}`);
  console.log(`      add to the Enemies block: '${sheetImage}',`);
  if (opts.mapSprite) {
    console.log(`      add to the Enemies block: '/${SHEET_URL_DIR}/${slug}_map.png',`);
  }
  if (!opts.sheetOnly) {
    console.log(`  ${rel(path.join(REPO_ROOT, 'src', 'constants', 'enemies', 'world-00', 'index.ts'))}`);
    console.log(`      import { ${enemyConst} } from './${slug}';`);
    console.log(`      export { ${enemyConst} };`);
  }
  if (!opts.write) console.log(`\nRe-run with --write to apply.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
