/**
 * Tiled (.tmj/.json) -> `src/constants/maps/<id>/` scaffolder.
 *
 * Turns a Tiled JSON map export into the three things this repo needs to render it:
 *
 *   1. `src/constants/maps/<id>/tiled-data.ts`  the TilemapData, minus the tileset block
 *   2. a `TilemapTileset` constant in `src/constants/maps/tileset-data.ts` (reused if the
 *      sheet is already there — that dedupe is the whole point of the shared file)
 *   3. `src/constants/maps/<id>/config.ts`      the MapDefinition
 *
 * Tiled writes its tilesets as *external* refs (`{ firstgid, source: 'x.tsx' }`), so the
 * script resolves and inlines that sidecar — both the XML `.tsx` and the JSON `.tsj`/`.json`
 * flavours — and rewrites the `../public/assets/...` authoring path to the `/assets/...`
 * path the browser actually fetches.
 *
 * Usage:
 *   node scripts/tiled-to-map.mjs tiled/pc-forest-01.tmj --id map-02-deep-woods
 *   node scripts/tiled-to-map.mjs tiled/pc-forest-01.tmj --id map-02-deep-woods --write
 *   node scripts/tiled-to-map.mjs tiled/cave.tmj --id map-03-cave --walkable floor,bridge --write
 *
 * Flags:
 *   --id <map-id>       Folder name and MapId. Default: the input's basename.
 *   --name <text>       displayMapName. Default: Title Case of the id, minus its `map-NN-` prefix.
 *   --walkable <a,b>    Walkable layer names. Default: `road` if the map has such a layer,
 *                       otherwise the script stops and asks — a wrong guess here is a map
 *                       the player cannot walk on.
 *   --visible <a,b>     Rendered layers, in draw order. Default: every tile layer, in file order.
 *   --walkable-layer <name>, --visible-layer <name>
 *                       One exact layer name, not comma-split. Repeatable, and mixable with
 *                       the list forms — the only way to name a layer that contains a comma
 *                       (this repo has one: `chests, barrils and doors`).
 *   --tileset <CONST>   Force reuse of a named constant in tileset-data.ts instead of
 *                       matching on image path.
 *   --spawn <x,y>       defaultPlayerPosition in tiles. Default: the map's centre.
 *   --out <dir>         Output root. Default: src/constants/maps.
 *   --write             Write files (default is a dry run that reports what it would do).
 *   --force             Overwrite an existing map folder.
 *
 * The registry wiring is deliberately NOT automated — the script prints the three edits
 * (`MapId`, `MAP_REGISTRY`, `MAP_ID_COVERAGE`) so they stay reviewable.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TILESET_DATA_FILE = path.join(REPO_ROOT, 'src', 'constants', 'maps', 'tileset-data.ts');

/** Tile size the character sprite constants are calibrated against (src/constants/character-sprite.ts). */
const BASELINE_TILE_PX = 16;
const CHARACTER_BODY_HEIGHT_TILES = 2.625;

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    input: null,
    id: null,
    name: null,
    walkable: null,
    visible: null,
    tileset: null,
    spawn: null,
    out: path.join('src', 'constants', 'maps'),
    write: false,
    force: false,
  };
  const list = (value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--id') opts.id = argv[++i];
    else if (arg === '--name') opts.name = argv[++i];
    else if (arg === '--walkable') opts.walkable = [...(opts.walkable ?? []), ...list(argv[++i])];
    else if (arg === '--visible') opts.visible = [...(opts.visible ?? []), ...list(argv[++i])];
    // Exact, un-split forms — the only way to name a layer containing a comma.
    else if (arg === '--walkable-layer') opts.walkable = [...(opts.walkable ?? []), argv[++i]];
    else if (arg === '--visible-layer') opts.visible = [...(opts.visible ?? []), argv[++i]];
    else if (arg === '--tileset') opts.tileset = argv[++i];
    else if (arg === '--spawn') opts.spawn = list(argv[++i]).map(Number);
    else if (arg === '--out') opts.out = argv[++i];
    else if (arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    else if (!opts.input) opts.input = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!opts.input) throw new Error('Usage: node scripts/tiled-to-map.mjs <input.tmj> [--id map-02-name] [--write]');
  if (opts.spawn && (opts.spawn.length !== 2 || opts.spawn.some(Number.isNaN))) {
    throw new Error('--spawn expects two numbers, e.g. --spawn 35,39');
  }
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

const toCamel = (value) => {
  const parts = toKebab(value).split('-');
  return (
    parts[0] +
    parts
      .slice(1)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')
  );
};

/** `map-02-deep-woods` -> `Deep Woods`; a bare `cave` -> `Cave`. */
const toDisplayName = (id) =>
  toKebab(id)
    .replace(/^map-\d+-?/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ') || 'Untitled Map';

/* ------------------------------------------------------------------ */
/*  Tileset resolution                                                 */
/* ------------------------------------------------------------------ */

/**
 * Rewrites a Tiled authoring image path (`../public/assets/tileset/x.png`) into the
 * runtime path the browser fetches (`/assets/tileset/x.png`).
 */
function toRuntimeImagePath(source) {
  const normalized = source.replace(/\\/g, '/');
  const assetsAt = normalized.indexOf('/assets/');
  if (assetsAt !== -1) return normalized.slice(assetsAt);
  return `/assets/tileset/${path.basename(normalized)}`;
}

/** Pulls `key="value"` pairs out of one XML tag. */
function xmlAttrs(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
}

/** Parses a Tiled `.tsx` (XML) tileset into the same shape a `.tsj` gives us. */
function parseTsx(xml, file) {
  const tilesetTag = xml.match(/<tileset\b[^>]*>/);
  const imageTag = xml.match(/<image\b[^>]*\/?>/);
  if (!tilesetTag || !imageTag) throw new Error(`${file} is not a single-image Tiled tileset`);

  const tileset = xmlAttrs(tilesetTag[0]);
  const image = xmlAttrs(imageTag[0]);
  return {
    columns: Number(tileset.columns),
    image: image.source,
    imageheight: Number(image.height),
    imagewidth: Number(image.width),
    margin: Number(tileset.margin ?? 0),
    name: tileset.name,
    spacing: Number(tileset.spacing ?? 0),
    tilecount: Number(tileset.tilecount),
    tileheight: Number(tileset.tileheight),
    tilewidth: Number(tileset.tilewidth),
  };
}

/**
 * Returns the map's single tileset as a `TilemapTileset`-shaped object, following an
 * external `source` ref when Tiled wrote one.
 */
function resolveTileset(tiled, inputFile) {
  const entries = tiled.tilesets ?? [];
  if (entries.length === 0) throw new Error('Map has no tileset.');
  if (entries.length > 1) {
    throw new Error(
      `Map uses ${entries.length} tilesets; tile-map.tsx only reads tilesets[0]. Merge the sheets in Tiled first.`,
    );
  }

  const entry = entries[0];
  const firstgid = entry.firstgid ?? 1;
  let raw = entry;

  if (entry.source) {
    const sidecar = path.resolve(path.dirname(inputFile), entry.source);
    if (!existsSync(sidecar)) throw new Error(`External tileset not found: ${entry.source} (looked in ${sidecar})`);
    const text = readFileSync(sidecar, 'utf8');
    raw = /\.tsx$/i.test(sidecar) ? parseTsx(text, entry.source) : JSON.parse(text);
  }

  // Tiled's authoring metadata (tiledversion/type/version) is dropped — nothing reads it.
  return {
    columns: raw.columns,
    firstgid,
    image: toRuntimeImagePath(raw.image),
    imageheight: raw.imageheight,
    imagewidth: raw.imagewidth,
    margin: raw.margin ?? 0,
    name: raw.name,
    spacing: raw.spacing ?? 0,
    tilecount: raw.tilecount,
    tileheight: raw.tileheight,
    tilewidth: raw.tilewidth,
  };
}

/** Existing `export const NAME: TilemapTileset` entries, keyed by their runtime image path. */
function readExistingTilesets() {
  if (!existsSync(TILESET_DATA_FILE)) return {};
  const source = readFileSync(TILESET_DATA_FILE, 'utf8');
  const found = {};
  const pattern = /export const (\w+): TilemapTileset = \{([\s\S]*?)\n\};/g;
  for (const [, name, body] of source.matchAll(pattern)) {
    const image = body.match(/image:\s*'([^']+)'/);
    if (image) found[image[1]] = name;
  }
  return found;
}

/* ------------------------------------------------------------------ */
/*  Code generation                                                    */
/* ------------------------------------------------------------------ */

function renderTilesetConstant(name, tileset, mapLabel) {
  const px = `${tileset.imagewidth}×${tileset.imageheight} @ ${tileset.tilewidth}px`;
  const note =
    tileset.tilewidth === BASELINE_TILE_PX ? '' : ' Non-16px tiles: maps need a `characterBodyHeightTiles` override.';
  return [
    `\n/** ${px} — ${mapLabel}.${note} */`,
    `export const ${name}: TilemapTileset = ${JSON.stringify(tileset, null, 2)};`,
  ].join('\n');
}

function renderTiledData(tiled, layers, tilesetConstant, exportName) {
  const map = {
    compressionlevel: tiled.compressionlevel ?? -1,
    height: tiled.height,
    infinite: tiled.infinite ?? false,
    layers,
    nextlayerid: tiled.nextlayerid,
    nextobjectid: tiled.nextobjectid,
    orientation: tiled.orientation,
    renderorder: tiled.renderorder,
    tiledversion: tiled.tiledversion,
    tileheight: tiled.tileheight,
    tilewidth: tiled.tilewidth,
    type: tiled.type,
    version: tiled.version,
    width: tiled.width,
  };

  // `tilesets` is spliced in as an identifier, so it cannot go through JSON.stringify.
  const body = JSON.stringify(map, (_key, value) => (value === undefined ? undefined : value), 2).replace(
    /\n(\s*)"tileheight":/,
    `\n$1"tilesets": [__TILESETS__],\n$1"tileheight":`,
  );

  return [
    `import type { TilemapData } from '~/types/tilemap';`,
    `import { ${tilesetConstant} } from '../tileset-data';`,
    ``,
    `export const ${exportName}: TilemapData = ${body.replace('"__TILESETS__"', tilesetConstant).replace('__TILESETS__', tilesetConstant)};`,
    ``,
  ].join('\n');
}

function renderConfig({ id, displayName, exportName, walkable, visible, spawn, bodyHeightTiles }) {
  const constName = toUpperSnake(id);
  const lines = [
    `import type { MapDefinition } from '~/types/map';`,
    `import { ${exportName} } from './tiled-data';`,
    ``,
    `export const ${constName}: MapDefinition = {`,
    `  id: '${id}',`,
    `  tilesetImage: TILESET_PLACEHOLDER.image,`,
    `  displayMapName: '${displayName.replace(/'/g, "\\'")}',`,
    `  walkableLayers: ${JSON.stringify(walkable)},`,
    `  visibleLayers: ${JSON.stringify(visible)},`,
    `  defaultPlayerPosition: { x: ${spawn[0]}, y: ${spawn[1]} },`,
    `  debug: true,`,
  ];
  if (bodyHeightTiles !== null) {
    lines.push(`  // ${bodyHeightTiles.tilePx}px tiles: keep the same 42px body the 16px maps draw.`);
    lines.push(`  characterBodyHeightTiles: ${bodyHeightTiles.value},`);
  }
  lines.push(`  tiledData: ${exportName},`, `};`, ``);
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const inputFile = path.resolve(REPO_ROOT, opts.input);
  if (!existsSync(inputFile)) throw new Error(`Input not found: ${opts.input}`);
  const tiled = JSON.parse(readFileSync(inputFile, 'utf8'));

  if (tiled.orientation && tiled.orientation !== 'orthogonal') {
    throw new Error(`Only orthogonal maps render; this one is "${tiled.orientation}".`);
  }
  if (tiled.infinite) throw new Error('Infinite maps are not supported. Uncheck "Infinite" in Tiled > Map Properties.');

  const id = toKebab(opts.id ?? path.basename(inputFile).replace(/\.(tmj|json)$/i, ''));
  const displayName = opts.name ?? toDisplayName(id);
  const exportName = `${toCamel(id)}TiledData`;

  /* ---- layers ---- */
  const tileLayers = (tiled.layers ?? []).filter((layer) => layer.type === 'tilelayer');
  if (tileLayers.length === 0) throw new Error('Map has no tile layers.');

  const dropped = (tiled.layers ?? []).filter((layer) => layer.type !== 'tilelayer');
  const encoded = tileLayers.filter((layer) => !Array.isArray(layer.data));
  if (encoded.length > 0) {
    throw new Error(
      `Layer(s) ${encoded.map((l) => l.name).join(', ')} are base64/compressed. ` +
        'Re-export from Tiled with Map > Properties > Tile Layer Format = "CSV".',
    );
  }

  const layerNames = tileLayers.map((layer) => layer.name);
  const visible = opts.visible ?? layerNames;
  const walkable = opts.walkable ?? (layerNames.includes('road') ? ['road'] : null);
  if (!walkable) {
    throw new Error(
      `No "road" layer to infer walkability from. Pass --walkable with one or more of: ${layerNames.join(', ')}`,
    );
  }
  for (const [flag, names] of [
    ['--walkable', walkable],
    ['--visible', visible],
  ]) {
    const unknown = names.filter((name) => !layerNames.includes(name));
    if (unknown.length > 0) throw new Error(`${flag} names layer(s) not in the map: ${unknown.join(', ')}`);
  }

  const layers = tileLayers.map((layer) => ({
    data: layer.data,
    height: layer.height,
    id: layer.id,
    name: layer.name,
    opacity: layer.opacity,
    type: layer.type,
    visible: layer.visible,
    width: layer.width,
    x: layer.x,
    y: layer.y,
  }));

  /* ---- tileset ---- */
  const tileset = resolveTileset(tiled, inputFile);
  const existing = readExistingTilesets();
  const matched = opts.tileset ?? existing[tileset.image];
  const tilesetConstant = matched ?? `TILESET_${toUpperSnake(tileset.name)}`;
  const isNewTileset = !matched;

  const imageOnDisk = path.join(REPO_ROOT, 'public', tileset.image.replace(/^\//, ''));
  const imageMissing = !existsSync(imageOnDisk);

  const bodyHeightTiles =
    tileset.tilewidth === BASELINE_TILE_PX
      ? null
      : {
          tilePx: tileset.tilewidth,
          value: Number(((CHARACTER_BODY_HEIGHT_TILES * BASELINE_TILE_PX) / tileset.tilewidth).toFixed(6)),
        };

  const spawn = opts.spawn ?? [Math.floor(tiled.width / 2), Math.floor(tiled.height / 2)];

  /* ---- render ---- */
  const prettierOptions = { ...((await resolveConfig(TILESET_DATA_FILE)) ?? {}), parser: 'typescript' };
  delete prettierOptions.plugins; // only the tailwind class sorter; irrelevant to these files

  const outDir = path.resolve(REPO_ROOT, opts.out, id);
  const tiledDataFile = path.join(outDir, 'tiled-data.ts');
  const configFile = path.join(outDir, 'config.ts');

  if (existsSync(outDir) && !opts.force) {
    throw new Error(`${path.relative(REPO_ROOT, outDir)} already exists. Pass --force to overwrite.`);
  }

  const tiledDataSource = await format(renderTiledData(tiled, layers, tilesetConstant, exportName), prettierOptions);
  const configSource = await format(
    renderConfig({ id, displayName, exportName, walkable, visible, spawn, bodyHeightTiles }).replace(
      'TILESET_PLACEHOLDER',
      tilesetConstant,
    ),
    prettierOptions,
  ).then((code) =>
    code.replace(
      `import { ${exportName} } from './tiled-data';`,
      `import { ${exportName} } from './tiled-data';\nimport { ${tilesetConstant} } from '../tileset-data';`,
    ),
  );

  const tilesetSource = isNewTileset
    ? await format(
        readFileSync(TILESET_DATA_FILE, 'utf8') + renderTilesetConstant(tilesetConstant, tileset, displayName),
        prettierOptions,
      )
    : null;

  /* ---- report ---- */
  const rel = (file) => path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  console.log(`input:    ${rel(inputFile)}  (${tiled.width}×${tiled.height} @ ${tiled.tilewidth}px)`);
  console.log(`map id:   ${id}  "${displayName}"`);
  console.log(`tileset:  ${tilesetConstant} -> ${tileset.image}${isNewTileset ? '  (new)' : '  (reused)'}`);
  console.log(`layers:   ${layerNames.length} tile layer(s): ${layerNames.join(', ')}`);
  console.log(`walkable: ${walkable.join(', ')}`);
  console.log(`spawn:    ${spawn[0]},${spawn[1]}${opts.spawn ? '' : ' (map centre — set with --spawn)'}`);
  console.log(`mode:     ${opts.write ? 'WRITE' : 'dry run (pass --write to apply)'}\n`);

  if (dropped.length > 0) {
    console.log(`  note   dropped ${dropped.length} non-tile layer(s): ${dropped.map((l) => l.name).join(', ')}`);
  }
  if (imageMissing) {
    console.log(
      `  WARN   tileset image not in public/: ${tileset.image} — copy the sheet there or the map renders blank.`,
    );
  }
  if (bodyHeightTiles) {
    console.log(
      `  note   ${bodyHeightTiles.tilePx}px tiles: config sets characterBodyHeightTiles ${bodyHeightTiles.value}`,
    );
  }

  const label = opts.write ? 'ok    ' : 'would ';
  console.log(`  ${label} write ${rel(tiledDataFile)}  (${layers.length} layers)`);
  console.log(`  ${label} write ${rel(configFile)}`);
  if (isNewTileset) console.log(`  ${label} append ${tilesetConstant} to ${rel(TILESET_DATA_FILE)}`);

  if (opts.write) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(tiledDataFile, tiledDataSource);
    writeFileSync(configFile, configSource);
    if (tilesetSource) writeFileSync(TILESET_DATA_FILE, tilesetSource);
  }

  /* ---- the wiring the script leaves to you ---- */
  const constName = toUpperSnake(id);
  console.log(`\nStill to wire up by hand:`);
  console.log(`  src/types/map.ts          add '${id}' to the MapId union`);
  console.log(
    `  src/constants/maps/index.ts   import { ${constName} } from './${id}/config';  + '${id}': ${constName},`,
  );
  console.log(`  src/types/save-game.ts    add '${id}': true to MAP_ID_COVERAGE`);
  if (!opts.write) console.log(`\nRe-run with --write to apply.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
