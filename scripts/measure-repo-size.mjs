/**
 * Measures how much disk space the project occupies, excluding dependencies and
 * build output by default.
 *
 * "How big is this repo?" is awkward to answer on Windows: Explorer's folder
 * properties counts node_modules (hundreds of MB of other people's code) and
 * `du` is not available. This walks the tree once, prunes the noise directories
 * before descending into them, and reports the number plus where the bytes are.
 *
 * Usage:
 *   node scripts/measure-repo-size.mjs                 # source + assets, no deps/build
 *   node scripts/measure-repo-size.mjs --all           # include build output and caches
 *   node scripts/measure-repo-size.mjs --tracked       # only files git tracks
 *   node scripts/measure-repo-size.mjs --by-ext        # add a breakdown by extension
 *   node scripts/measure-repo-size.mjs --top 20        # show the 20 largest files
 *   node scripts/measure-repo-size.mjs --json          # machine-readable output
 *
 * Flags:
 *   --all          Only prune node_modules and .git; count build output and caches.
 *   --tracked      Measure just the files in `git ls-files` (what a clone costs).
 *   --by-ext       Print a per-extension table as well as the per-directory one.
 *   --top <n>      Number of largest files to list. Default 10, 0 to skip.
 *   --json         Emit JSON instead of the text report.
 *   --exclude <d>  Prune an extra directory name. Repeatable.
 *
 * Efficiency note: cost here is one `lstat` per file, so the only real lever is
 * not walking into directories we are going to throw away. Pruning happens
 * before recursion, which is why node_modules costs nothing rather than being
 * filtered out after the fact.
 */

import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Never counted, and never descended into — these are not the project's own bytes. */
const ALWAYS_PRUNE = new Set(['node_modules', '.git']);

/** Generated or vendored output: excluded by default, included with --all. */
const GENERATED_PRUNE = new Set([
  'dist',
  'dist-electron',
  'build',
  'out',
  'release',
  'coverage',
  '.vite',
  '.turbo',
  '.cache',
  '.playwright-mcp',
  '.atl',
]);

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = { all: false, tracked: false, byExt: false, top: 10, json: false, exclude: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') opts.all = true;
    else if (arg === '--tracked') opts.tracked = true;
    else if (arg === '--by-ext') opts.byExt = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--top') opts.top = Number(argv[++i]);
    else if (arg === '--exclude') opts.exclude.push(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(opts.top) || opts.top < 0) {
    throw new Error('--top must be a non-negative integer');
  }
  return opts;
}

const mb = (bytes) => bytes / 1024 / 1024;

/** Formats a byte count at whichever unit keeps it readable. */
function human(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${mb(bytes).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/* ------------------------------------------------------------------ */
/*  Walk                                                               */
/* ------------------------------------------------------------------ */

/**
 * Accumulates sizes under `dir`, pruning excluded directory names before
 * recursing. Symlinks are counted as their own (tiny) entry and never followed,
 * so a link loop cannot hang the walk and a linked tree is not double-counted.
 *
 * @param dir Absolute directory to walk.
 * @param prune Directory names to skip entirely.
 * @param acc Mutable accumulator: `{ bytes, files, dirs, largest, byExt }`.
 */
function walk(dir, prune, acc) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable directory (permissions, or deleted mid-walk)
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (prune.has(entry.name)) continue;
      acc.dirs += 1;
      walk(full, prune, acc);
      continue;
    }

    // Covers files and symlinks. lstat so links are not followed.
    const stat = lstatSync(full, { throwIfNoEntry: false });
    if (!stat || stat.isDirectory()) continue;

    acc.bytes += stat.size;
    acc.files += 1;
    recordFile(acc, full, stat.size);
  }
}

/** Files git knows about — what someone actually downloads when they clone. */
function walkTracked(acc) {
  const out = execFileSync('git', ['-C', REPO_ROOT, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  for (const relative of out.split('\0')) {
    if (!relative) continue;
    const full = path.join(REPO_ROOT, relative);
    const stat = statSync(full, { throwIfNoEntry: false });
    if (!stat || !stat.isFile()) continue; // submodule entry, or deleted but still indexed

    acc.bytes += stat.size;
    acc.files += 1;
    recordFile(acc, full, stat.size);
  }
}

/** Adds one file to the per-directory, per-extension and largest-files tallies. */
function recordFile(acc, full, size) {
  const relative = path.relative(REPO_ROOT, full);
  const segments = relative.split(path.sep);
  const bucket = segments.length > 1 ? segments[0] : '(root files)';
  acc.byDir.set(bucket, (acc.byDir.get(bucket) ?? 0) + size);

  const ext = path.extname(full).toLowerCase() || '(no extension)';
  const extEntry = acc.byExt.get(ext) ?? { bytes: 0, files: 0 };
  extEntry.bytes += size;
  extEntry.files += 1;
  acc.byExt.set(ext, extEntry);

  acc.largest.push({ path: relative.split(path.sep).join('/'), size });
}

/* ------------------------------------------------------------------ */
/*  Report                                                             */
/* ------------------------------------------------------------------ */

function table(rows, totalBytes, limit = Infinity) {
  const shown = rows.slice(0, limit);
  const width = Math.max(...shown.map(([label]) => label.length), 4);
  const lines = [];
  for (const [label, bytes, extra] of shown) {
    const share = totalBytes > 0 ? (100 * bytes) / totalBytes : 0;
    const bar = '█'.repeat(Math.max(0, Math.round(share / 4)));
    lines.push(
      `  ${label.padEnd(width)}  ${human(bytes).padStart(9)}  ${share.toFixed(1).padStart(5)}%  ${bar}${extra ?? ''}`,
    );
  }
  return lines.join('\n');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  const prune = new Set([...ALWAYS_PRUNE, ...opts.exclude]);
  if (!opts.all) for (const name of GENERATED_PRUNE) prune.add(name);

  const acc = { bytes: 0, files: 0, dirs: 0, byDir: new Map(), byExt: new Map(), largest: [] };

  const startedAt = Date.now();
  if (opts.tracked) walkTracked(acc);
  else walk(REPO_ROOT, prune, acc);
  const elapsedMs = Date.now() - startedAt;

  acc.largest.sort((a, b) => b.size - a.size);
  const byDir = [...acc.byDir.entries()].sort((a, b) => b[1] - a[1]);
  const byExt = [...acc.byExt.entries()].sort((a, b) => b[1].bytes - a[1].bytes);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          mode: opts.tracked ? 'tracked' : opts.all ? 'all' : 'default',
          totalBytes: acc.bytes,
          totalMb: Number(mb(acc.bytes).toFixed(2)),
          files: acc.files,
          directories: acc.dirs,
          excluded: [...prune].sort(),
          byDirectory: byDir.map(([name, bytes]) => ({ name, bytes })),
          byExtension: byExt.map(([ext, v]) => ({ ext, bytes: v.bytes, files: v.files })),
          largestFiles: acc.largest.slice(0, opts.top || 0),
          elapsedMs,
        },
        null,
        2,
      ),
    );
    return;
  }

  const mode = opts.tracked
    ? 'git-tracked files only'
    : opts.all
      ? 'everything except node_modules and .git'
      : 'source and assets (build output, caches and deps excluded)';

  console.log(`\nProject size: ${human(acc.bytes)}  (${acc.files} files)`);
  console.log(`Measuring:    ${mode}`);
  if (!opts.tracked) console.log(`Pruned:       ${[...prune].sort().join(', ')}`);
  console.log(`Walked in:    ${elapsedMs} ms\n`);

  console.log('By top-level directory');
  console.log(table(byDir, acc.bytes));

  if (opts.byExt) {
    console.log('\nBy file type');
    console.log(
      table(
        byExt.map(([ext, v]) => [ext, v.bytes, `  ${v.files} file${v.files === 1 ? '' : 's'}`]),
        acc.bytes,
        15,
      ),
    );
  }

  if (opts.top > 0) {
    console.log(`\n${opts.top} largest files`);
    for (const file of acc.largest.slice(0, opts.top)) {
      console.log(`  ${human(file.size).padStart(9)}  ${file.path}`);
    }
  }

  console.log('');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
