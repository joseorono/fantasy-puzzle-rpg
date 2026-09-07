import type { OrbType } from '~/types';

// ─── Board ───────────────────────────────────────────────────────────────────

/** Board dimensions (rows × columns). Fixture grids in tests are literal 8×6 boards. */
export const BOARD_ROWS = 8;
export const BOARD_COLS = 6;

/** Every orb color. Spawns are uniform over this list. */
export const ORB_TYPES: OrbType[] = ['blue', 'green', 'purple', 'yellow', 'gray'];

/** Orbs in a line needed for a match; also the window size of every localized match check. */
export const MIN_MATCH_LENGTH = 3;

// ─── Bombs ───────────────────────────────────────────────────────────────────

/** A line match of this size or larger spawns a wildcard bomb in the refill. */
export const BOMB_MATCH_SPAWN_THRESHOLD = 5;

/** Chance (0-1) that any individual refilled orb spawns as a wildcard bomb. */
export const BOMB_REFILL_CHANCE = 0.02;

/** After the first bomb spawns in a cascade chain, the per-orb bomb chance is multiplied by this. */
export const CASCADE_BOMB_CHANCE_MULTIPLIER = 0.75;

/** Max wildcard bombs that may spawn across a single cascade chain (anti-runaway). */
export const MAX_CHAIN_BOMB_SPAWNS = 3;

// ─── Opening board ───────────────────────────────────────────────────────────
// The deal is rejection-sampled from the natural random distribution, so openings stay as
// random as before; these knobs only truncate it. Nothing here touches mid-battle refills.

/** Opening boards may contain at most this many pre-made runs: a small free cascade, never a runaway one. 0 = always settled. */
export const OPENING_MAX_MATCHES = 2;

/** Longest pre-made run allowed on an opening board. Kept below BOMB_MATCH_SPAWN_THRESHOLD so a deal never hands out a free bomb. */
export const OPENING_MAX_RUN_LENGTH = BOMB_MATCH_SPAWN_THRESHOLD - 1;

/** Random deals tried for an opening board before falling back to a constraint-aware (match-free) fill. */
export const MAX_BOARD_GENERATION_ATTEMPTS = 20;

// ─── Playability guarantee ───────────────────────────────────────────────────

/** Re-draws of the freshly spawned orbs tried on a dead board before the whole board is reshuffled. */
export const MAX_SPAWN_REROLLS = 8;

/** Permutations tried by a reshuffle to land a settled layout (same colors, bombs pinned) before accepting one with a run. */
export const MAX_RESHUFFLE_ATTEMPTS = 10;
