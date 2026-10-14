import type { ChestVariant } from '~/types/chest';

/** Admurin's "Free Chest Animations": 5 frames per row, two rows (idle, open) per variant. */
export const CHEST_SPRITE_SHEET = {
  image: '/assets/sprite/chest/admurin-chests.png',
  frameWidth: 48,
  frameHeight: 32,
  framesPerRow: 5,
} as const;

/** Which pair of rows each variant occupies on the sheet. */
export const CHEST_VARIANT_INDEX: Record<ChestVariant, number> = {
  wood: 0,
  ebony: 1,
  royal: 2,
  frost: 3,
};

export const DEFAULT_CHEST_VARIANT: ChestVariant = 'wood';

/** Horizontal centre of the closed chest inside its 48px frame; the open lid spills right of it. */
export const CHEST_ANCHOR_X_PX = 15;

/** Map idle: one pass through the glint row, then a rest on frame 0 so it never jitters. */
export const CHEST_IDLE_FRAME_MS = 130;
export const CHEST_IDLE_HOLD_MS = 1400;

/** Spreads neighbouring chests' glints apart, per tile row/col. */
export const CHEST_IDLE_TILE_OFFSET_MS = { row: 370, col: 230 } as const;

/** The opening ceremony's beats and dressing. */
export const CHEST_OPENING = {
  /** Display scale of the sprite in the overlay. */
  displayScale: 2,
  /** How long the chest rattles before the lid pops. */
  shakeMs: 1150,
  /** When each rattle starts, within `shakeMs`; keep in step with `chest-rattle` in chest-opening.css. */
  rattleAtMs: [0, 420, 800],
  rattleVolume: 0.35,
  /** Playback speed added per rattle, so the clicks wind up. */
  rattlePitchStep: 0.12,
  /** Per frame of the open row. */
  openFrameMs: 80,
  /** From the lid popping to the loot rising out. */
  revealDelayMs: 450,
  /** From the loot rising out to the overlay closing on its own. */
  revealHoldMs: 3200,
  /** Gap between each loot entry rising out. */
  lootStaggerMs: 110,
  burstParticleCount: 30,
  sparkleCount: 24,
  /** Glow and particle tint when the chest holds no equipment. */
  defaultGlowColor: '#e8b45a',
} as const;
