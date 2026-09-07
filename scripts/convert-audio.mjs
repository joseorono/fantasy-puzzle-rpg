/**
 * Audio transcoder for the game's oversized WAV assets.
 *
 * public/assets/audio ships ~84 MB, of which ~80 MB is four uncompressed WAV
 * music tracks. WAV is raw PCM, so those bytes are also the download and the
 * decode cost at startup. Transcoding the music to Ogg Vorbis cuts roughly 90%
 * of that with no audible difference at these bitrates.
 *
 * Usage:
 *   node scripts/convert-audio.mjs                 # music tier, dry run report
 *   node scripts/convert-audio.mjs --write         # actually transcode
 *   node scripts/convert-audio.mjs --tier sfx --write
 *   node scripts/convert-audio.mjs --tier all --write
 *   node scripts/convert-audio.mjs --format m4a --write
 *
 * Flags:
 *   --write              Perform the conversion (default is a dry-run report).
 *   --tier music|sfx|all Which group to convert. Default: music.
 *   --format ogg|m4a     Output codec. Default: ogg.
 *   --quality <n>        Vorbis -q (0-10, default 5) or AAC kbps for m4a.
 *   --delete-originals   Remove the source WAV after a verified conversion.
 *   --force              Overwrite existing output files.
 *
 * Originals are kept unless --delete-originals is passed, so a bad encode is
 * always recoverable. Nothing here edits source code: after converting, update
 * the paths in src/constants/audio.ts to the new extension.
 *
 * ffmpeg resolution order: a system `ffmpeg` on PATH, else the binary from the
 * optional `ffmpeg-static` devDependency.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_ROOT = path.join(REPO_ROOT, 'public', 'assets', 'audio');

/* ------------------------------------------------------------------ */
/*  Conversion registry — paths are relative to public/assets/audio    */
/* ------------------------------------------------------------------ */

/**
 * Music: long stereo tracks. These dominate the payload and are the whole
 * reason this script exists.
 *
 * `fight-music-loop` and `boss-fight` are declared in src/constants/audio.ts
 * but never played by any code in src/ — converting them is optional; deleting
 * them outright saves ~66 MB.
 */
const MUSIC_TIER = [
  'ui/fight-music-loop.wav',
  'ui/boss-fight.wav',
  'ui/epic-cinematic.wav',
  'bg-noise/combatMusic.wav',
];

/**
 * SFX: short one-shots. Individually small, ~3 MB together. Lower priority —
 * they are latency-sensitive, though Vorbis decode is fast enough to be a
 * non-issue for clips this short.
 */
const SFX_TIER = [
  'bg-noise/blacksmith.wav',
  'bg-noise/blacksmith-shorter.wav',
  'bg-noise/metal-sharpening.wav',
  'bg-noise/bottle-clink.wav',
  'bg-noise/jingle.wav',
  'ui/shimmering-success.wav',
  'ui/shimmering-success-short.wav',
  'ui/shimmering-success-shorter.wav',
  'ui/uncork.wav',
  'ui/match.wav',
  'ui/beep.wav',
  'ui/mechanical-click.wav',
];

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opts = {
    write: false,
    tier: 'music',
    format: 'ogg',
    quality: null,
    deleteOriginals: false,
    force: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--delete-originals') opts.deleteOriginals = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--tier') opts.tier = argv[++i];
    else if (arg === '--format') opts.format = argv[++i];
    else if (arg === '--quality') opts.quality = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['music', 'sfx', 'all'].includes(opts.tier)) {
    throw new Error(`--tier must be music, sfx or all (got "${opts.tier}")`);
  }
  if (!['ogg', 'm4a'].includes(opts.format)) {
    throw new Error(`--format must be ogg or m4a (got "${opts.format}")`);
  }
  return opts;
}

/** Locates an ffmpeg binary, preferring a system install over the npm package. */
async function resolveFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (probe.status === 0) return 'ffmpeg';

  try {
    const mod = await import('ffmpeg-static');
    const binary = mod.default ?? mod;
    if (typeof binary === 'string' && existsSync(binary)) return binary;
  } catch {
    /* package not installed — fall through to the error below */
  }

  throw new Error(
    'No ffmpeg found. Either install it system-wide (winget install Gyan.FFmpeg)\n' +
      'or install the bundled binary as a devDependency: npm i -D ffmpeg-static',
  );
}

/** Builds the codec-specific ffmpeg arguments for one file. */
function encoderArgs(format, quality) {
  if (format === 'ogg') {
    // Vorbis quality scale: 5 ≈ 160 kbps stereo, transparent for game music.
    return ['-c:a', 'libvorbis', '-q:a', String(quality ?? 5)];
  }
  // AAC in an MP4 container. Universally supported, but note that AAC carries
  // encoder padding, so seamless looping is less reliable than with Vorbis.
  return ['-c:a', 'aac', '-b:a', `${quality ?? 160}k`];
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ffmpeg = await resolveFfmpeg();

  const sources =
    opts.tier === 'music' ? MUSIC_TIER : opts.tier === 'sfx' ? SFX_TIER : [...MUSIC_TIER, ...SFX_TIER];

  console.log(`ffmpeg:  ${ffmpeg}`);
  console.log(`tier:    ${opts.tier} (${sources.length} files)`);
  console.log(`format:  ${opts.format}`);
  console.log(`mode:    ${opts.write ? 'WRITE' : 'dry run (pass --write to convert)'}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  const converted = [];

  for (const relative of sources) {
    const source = path.join(AUDIO_ROOT, relative);
    if (!existsSync(source)) {
      console.log(`  skip   ${relative} — not found`);
      continue;
    }

    const target = source.replace(/\.wav$/i, `.${opts.format}`);
    const before = statSync(source).size;
    totalBefore += before;

    if (!opts.write) {
      console.log(`  would  ${relative}  ${mb(before)} MB -> ${path.basename(target)}`);
      continue;
    }

    if (existsSync(target) && !opts.force) {
      console.log(`  skip   ${relative} — ${path.basename(target)} exists (use --force)`);
      totalAfter += statSync(target).size;
      continue;
    }

    try {
      execFileSync(
        ffmpeg,
        ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, ...encoderArgs(opts.format, opts.quality), target],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      );
    } catch (error) {
      console.error(`  FAIL   ${relative}\n${error.stderr?.toString() ?? error.message}`);
      continue;
    }

    const after = statSync(target).size;
    totalAfter += after;
    converted.push({ relative, target, before, after });

    const saved = (100 * (1 - after / before)).toFixed(1);
    console.log(`  ok     ${relative}  ${mb(before)} -> ${mb(after)} MB  (-${saved}%)`);

    if (opts.deleteOriginals && after > 0) unlinkSync(source);
  }

  if (opts.write && converted.length > 0) {
    console.log(`\ntotal:   ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB`);
    console.log('\nNext: update the matching paths in src/constants/audio.ts:');
    for (const { relative, target } of converted) {
      console.log(`  /assets/audio/${relative}  ->  /assets/audio/${relative.replace(/\.wav$/i, path.extname(target))}`);
    }
    if (!opts.deleteOriginals) {
      console.log('\nOriginal .wav files were kept. Remove them once the game sounds correct.');
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
