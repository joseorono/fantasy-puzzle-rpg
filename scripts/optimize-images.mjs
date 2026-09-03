/**
 * In-place image recompressor for public/assets.
 *
 * The asset folder ships ~31 MB of PNG/JPEG, led by the four ~3 MB skill icon
 * sheets that assets-service.ts preloads at startup.
 *
 * Files are rewritten **in place, keeping the same filename and format**, so no
 * `src` path in the codebase changes. That is deliberate: switching to WebP
 * would touch dozens of call sites, while recompression is free.
 *
 * Three modes, in increasing order of risk:
 *
 *   default     PNG only, mathematically lossless (re-deflate at max effort).
 *               Pixels are bit-identical; safe to run and commit unreviewed.
 *   --jpeg      Also re-encode JPEGs with mozjpeg. LOSSY and generational —
 *               re-running it repeatedly keeps degrading the same file.
 *   --palette   Quantize PNGs to 256 colours. LOSSY unless the source already
 *               has <=256 colours (the skill sheets and menu art do NOT — they
 *               were measured well above it), but it is the only thing that
 *               meaningfully shrinks those sheets (~-67%).
 *
 * Usage:
 *   node scripts/optimize-images.mjs                      # dry run, lossless
 *   node scripts/optimize-images.mjs --write
 *   node scripts/optimize-images.mjs --dir public/assets/skills --palette
 *   node scripts/optimize-images.mjs --jpeg --jpeg-quality 88 --write
 *
 * Flags:
 *   --write         Rewrite files (default is a dry-run report).
 *   --dir <path>    Limit to a subtree. Default: public/assets.
 *   --jpeg          Opt in to lossy JPEG re-encoding (off by default).
 *   --jpeg-quality  JPEG quality, 1-100. Default 82 (mozjpeg).
 *   --palette       Opt in to lossy PNG palette quantization (off by default).
 *   --min-gain <n>  Only keep a rewrite that saves at least n percent. Default 2.
 *
 * Always eyeball the affected art after a lossy run before committing.
 *
 * Requires the `sharp` devDependency: npm i -D sharp
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    write: false,
    dir: path.join('public', 'assets'),
    palette: false,
    jpeg: false,
    jpegQuality: 82,
    minGain: 2,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--palette') opts.palette = true;
    else if (arg === '--jpeg') opts.jpeg = true;
    else if (arg === '--dir') opts.dir = argv[++i];
    else if (arg === '--jpeg-quality') {
      opts.jpegQuality = Number(argv[++i]);
      opts.jpeg = true;
    } else if (arg === '--min-gain') opts.minGain = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

/** Recursively collects PNG/JPEG paths under a directory. */
function collectImages(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(png|jpe?g)$/i.test(entry.name)) found.push(full);
    }
  };
  walk(root);
  return found.sort((a, b) => statSync(b).size - statSync(a).size);
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp is not installed. Run: npm i -D sharp');
    process.exit(1);
  }

  const root = path.resolve(REPO_ROOT, opts.dir);
  const images = collectImages(root).filter((f) => opts.jpeg || /\.png$/i.test(f));

  console.log(`dir:     ${opts.dir} (${images.length} images)`);
  console.log(`png:     ${opts.palette ? 'palette quantized — LOSSY, verify visually' : 'lossless recompress'}`);
  console.log(
    `jpeg:    ${opts.jpeg ? `re-encode at q${opts.jpegQuality} — LOSSY, verify visually` : 'skipped (pass --jpeg to include)'}`,
  );
  console.log(`mode:    ${opts.write ? 'WRITE (in place)' : 'dry run (pass --write to apply)'}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let rewritten = 0;

  for (const file of images) {
    const before = statSync(file).size;
    totalBefore += before;

    const isPng = /\.png$/i.test(file);
    let output;
    try {
      const pipeline = sharp(file);
      output = isPng
        ? await pipeline
            .png({ compressionLevel: 9, effort: 10, palette: opts.palette })
            .toBuffer()
        : await pipeline.jpeg({ quality: opts.jpegQuality, mozjpeg: true }).toBuffer();
    } catch (error) {
      console.log(`  FAIL   ${path.relative(REPO_ROOT, file)} — ${error.message}`);
      totalAfter += before;
      continue;
    }

    const gain = 100 * (1 - output.length / before);
    if (gain < opts.minGain) {
      totalAfter += before;
      continue;
    }

    totalAfter += output.length;
    rewritten += 1;
    const label = opts.write ? 'ok    ' : 'would ';
    console.log(
      `  ${label} ${path.relative(REPO_ROOT, file)}  ${mb(before)} -> ${mb(output.length)} MB  (-${gain.toFixed(1)}%)`,
    );

    if (opts.write) writeFileSync(file, output);
  }

  const saved = totalBefore - totalAfter;
  console.log(
    `\n${rewritten} file(s) ${opts.write ? 'rewritten' : 'would change'}: ` +
      `${mb(totalBefore)} MB -> ${mb(totalAfter)} MB (saves ${mb(saved)} MB)`,
  );
  if (!opts.write && rewritten > 0) console.log('Re-run with --write to apply.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
