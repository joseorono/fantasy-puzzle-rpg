// ─── Stella sprite sheets ────────────────────────────────────────────
// Every Stella export of a kind shares the same layout, so the geometry lives here once.

/** Motions on a side-view battler sheet (RPG Maker SV layout). */
export type StellaMotion =
  | 'walk'
  | 'wait'
  | 'chant'
  | 'guard'
  | 'damage'
  | 'evade'
  | 'thrust'
  | 'swing'
  | 'missile'
  | 'skill'
  | 'spell'
  | 'item'
  | 'escape'
  | 'victory'
  | 'dying'
  | 'abnormal'
  | 'sleep'
  | 'dead';

/** How a motion plays: `loop` ping-pongs 0-1-2-1, `once` plays 0-1-2 and holds the last frame. */
export type StellaPlayMode = 'loop' | 'once';

// Side-view battler: 1152×768, a 9×6 grid of 128px frames — three 3-column blocks × 6 rows.
export const STELLA_SV_FRAME_PX = 128;
export const STELLA_SV_FRAMES_PER_MOTION = 3;
export const STELLA_SV_SHEET_WIDTH_PX = 1152;
export const STELLA_SV_SHEET_HEIGHT_PX = 768;

/**
 * `col` is the motion block's first column (0 / 3 / 6), `row` is 0–5.
 *
 * Not every motion actually animates. Measured on the warrior and mage exports:
 *
 * - Animated (3 distinct frames):
 *   walk (standing/breathing cycle — use it for idle), victory, thrust, swing, missile,
 *   skill, spell, item; chant and sleep move only slightly.
 * - Static (one pose repeated across all 3 frames):
 *   wait, guard, damage, evade, escape, dying, abnormal, dead.
 *
 * Static motions are fine as held poses (guard, damage flinch, dying → dead), but looping
 * one looks frozen.
 */
export const STELLA_SV_MOTIONS: Record<StellaMotion, { col: number; row: number }> = {
  walk: { col: 0, row: 0 },
  wait: { col: 0, row: 1 },
  chant: { col: 0, row: 2 },
  guard: { col: 0, row: 3 },
  damage: { col: 0, row: 4 },
  evade: { col: 0, row: 5 },
  thrust: { col: 3, row: 0 },
  swing: { col: 3, row: 1 },
  missile: { col: 3, row: 2 },
  skill: { col: 3, row: 3 },
  spell: { col: 3, row: 4 },
  item: { col: 3, row: 5 },
  escape: { col: 6, row: 0 },
  victory: { col: 6, row: 1 },
  dying: { col: 6, row: 2 },
  abnormal: { col: 6, row: 3 },
  sleep: { col: 6, row: 4 },
  dead: { col: 6, row: 5 },
};

/** Idle loop: `walk`, since `wait` is static in Stella exports (see STELLA_SV_MOTIONS). */
export const STELLA_IDLE_MOTION: StellaMotion = 'walk';

// Timing tunables (ms)
/** Full idle/victory ping-pong cycle (0-1-2-1). */
export const STELLA_IDLE_CYCLE_MS = 1040;
/** Per-frame time for one-shot motions; 3×150 = 450ms fits inside the 600ms skill-activate window. */
export const STELLA_CAST_FRAME_MS = 150;
/**
 * How long a match action plays. Triggers that land while it's still playing (fast cascades)
 * are ignored, so the motion always completes instead of twitching.
 */
export const STELLA_ACTION_MS = STELLA_CAST_FRAME_MS * STELLA_SV_FRAMES_PER_MOTION;
/** How long the damage flinch holds before returning to idle. */
export const STELLA_DAMAGE_MS = 500;
/** Dying pre-roll before settling into the lying `dead` pose. */
export const STELLA_DYING_MS = 450;
/** Guard pose hold — matches the BLOCK! popup window in `party-display.tsx`. */
export const STELLA_GUARD_HOLD_MS = 800;

// Walk sheet: 216×288, a 3×4 grid of 72px frames (reserved for the map integration).
export const STELLA_WALK_FRAME_PX = 72;
export const STELLA_WALK_DIRECTION_ROWS = { down: 0, left: 1, right: 2, up: 3 } as const;
