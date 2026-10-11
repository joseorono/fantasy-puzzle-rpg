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
 *   --cell <px>           Frame size. Default: the strips' height (cells must be square).
 *   --out <dir>           Output root for the generated TS. Default: src/constants/enemies/world-00.
 *   --id <slug>           Enemy id/slug. Default: kebab-case of the pack folder name.
 *   --name <text>         Enemy display name. Default: Title Case of the id.
 *   --anim <slot>=<name>  Force the strip whose suffix keyword is <name> into <slot>
 *                         (slot ∈ idle|move|hurt|attack1|attack2|ability). Repeatable.
 *   --attack-b fast|heavy Preset for the second attack in the generated enemy template.
 *                         Default: heavy.
 *   --sheet-only          Emit only the sheet constant (for re-skinning an existing enemy).
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
  idle: 150,
  move: 60,
  hurt: 60,
  attack1: 45,
  attack2: 45,
  ability: 60,
};

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
    write: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--sheet-only') opts.sheetOnly = true;
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
/*  Measurement + compositing                                          */
/* ------------------------------------------------------------------ */

/** One present row with its measured geometry. */
async function measureRow(row, cell) {
  const meta = await sharp(row.file).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width % cell !== 0) {
    throw new Error(`${row.file}: width ${width}px is not a whole number of ${cell}px cells.`);
  }
  return {
    ...row,
    file: row.file,
    width,
    height,
    frames: width / cell,
    frameDurationMs: FRAME_DURATION_MS[row.durationSlot],
  };
}

/** Composites the measured strips onto one transparent sheet, in row order. */
async function compositeSheet(rows, cell, sheetWidth) {
  const layers = rows.map((row) => ({ input: row.file, top: row.row * cell, left: 0 }));
  return sharp({
    create: {
      width: sheetWidth,
      height: rows.length * cell,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/* ------------------------------------------------------------------ */
/*  Code generation                                                    */
/* ------------------------------------------------------------------ */

const animLine = (slot, row) =>
  `    ${slot}: { row: ${row.row}, frames: ${row.frames}, frameDurationMs: ${row.frameDurationMs}, source: '${row.keyword}' },`;

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
        `      { row: ${row.row}, frames: ${row.frames}, frameDurationMs: ${row.frameDurationMs}, source: '${row.keyword}' },`,
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
  let cell;
  let sheetWidth;
  let sheetBuffer = null;

  if (isFolder) {
    const slots = collectFolderStrips(sourcePath, opts.anim);
    const order = buildRows(slots);
    if (order.length === 0) throw new Error(`No recognizable animations in ${opts.source}.`);

    // Cell defaults to the strips' height; every strip must agree on it, and cells must be square.
    const sizes = await Promise.all(order.map(async (row) => ({ row, meta: await sharp(row.file).metadata() })));
    const heights = new Set(sizes.map(({ meta }) => meta.height));
    if (heights.size > 1) {
      throw new Error(
        `All strips must share one height; found ${[...heights].sort((a, b) => a - b).join(', ')} in ${opts.source}.`,
      );
    }
    const stripHeight = sizes[0].meta.height ?? 0;
    cell = opts.cell ?? stripHeight;
    if (cell !== stripHeight) {
      throw new Error(
        `--cell ${opts.cell} does not match the strips' ${stripHeight}px height; cells must be square (one row per strip).`,
      );
    }

    rows = [];
    for (let index = 0; index < order.length; index += 1) {
      rows.push({ ...(await measureRow(order[index], cell)), row: index });
    }
    sheetWidth = Math.max(...rows.map((row) => row.width));
    sheetBuffer = await compositeSheet(rows, cell, sheetWidth);
  } else {
    const meta = await sharp(sourcePath).metadata();
    const imageWidth = meta.width ?? 0;
    const imageHeight = meta.height ?? 0;
    cell = opts.cell ?? imageHeight / 6;
    if (!Number.isInteger(cell) || cell <= 0) {
      throw new Error(`PNG mode needs --cell: ${imageHeight}px height is not a whole number of default 6 rows.`);
    }
    const rowCount = imageHeight / cell;
    if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > CANONICAL_SLOTS.length) {
      throw new Error(
        `PNG mode: ${imageHeight}px / ${cell}px = ${rowCount} rows; expected 1–${CANONICAL_SLOTS.length}.`,
      );
    }
    if (imageWidth % cell !== 0) {
      throw new Error(`PNG mode: width ${imageWidth}px is not a whole number of ${cell}px cells.`);
    }
    const frames = imageWidth / cell;
    rows = CANONICAL_SLOTS.slice(0, rowCount).map((slotKey, index) => ({
      slotKey,
      keyword: slotKey,
      durationSlot: slotKey,
      row: index,
      file: sourcePath,
      width: imageWidth,
      height: cell,
      frames,
      frameDurationMs: FRAME_DURATION_MS[slotKey],
    }));
    sheetWidth = imageWidth;
  }

  const sheetHeight = rows.length * cell;
  const sheet = { image: sheetImage, cellW: cell, cellH: cell, rows };
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
  console.log(`cell:     ${cell}×${cell} px${isFolder ? '' : ` (${opts.cell ? '--cell' : 'height ÷ 6'})`}`);
  console.log(`sheet:    ${sheetWidth}×${sheetHeight} px  (${rows.length} row(s))`);
  console.log(`mapping:`);
  for (const row of rows) {
    console.log(
      `  ${String(row.row).padEnd(5)} ${row.slotKey.padEnd(8)} ${String(row.frames).padStart(3)} frames  ` +
        `${String(row.frameDurationMs).padStart(3)}ms  ${row.keyword}  <- ${rel(row.file)}`,
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

  if (opts.write) {
    mkdirSync(path.dirname(sheetFile), { recursive: true });
    if (isFolder) writeFileSync(sheetFile, sheetBuffer);
    else if (sourcePath !== sheetFile) copyFileSync(sourcePath, sheetFile);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(tsFile, tsSource);
  }

  /* ---- the wiring the script leaves to you ---- */
  console.log(`\nStill to wire up by hand:`);
  console.log(`  ${rel(path.join(REPO_ROOT, 'src', 'services', 'assets-service.ts'))}`);
  console.log(`      add to the Enemies block: '${sheetImage}',`);
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
