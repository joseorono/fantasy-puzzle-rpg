/**
 * Geometry and timing for sprite sheets generated from Admurin monster packs
 * (see scripts/admurin-enemy-to-sprite-sheet.mjs). One combined sheet per enemy:
 * every animation is a row of square cells, stacked top to bottom.
 */

/** A single animation row on an Admurin enemy sheet. */
export interface AdmurinEnemyAnimation {
  /** 0-based row on the sheet. */
  row: number;
  /** Number of frames in the row. */
  frames: number;
  /** How long each frame is shown. */
  frameDurationMs: number;
  /**
   * Cell indices to play, in order — each held `frameDurationMs`. Lets a sheet repeat or ping-pong
   * frames (e.g. `[0, 1, 2, 3, 2, 1]`) without new pixels. Default: every cell once, left to right.
   */
  frameSequence?: number[];
  /** Optional row-switch dissolve duration; defaults to the shared enemy sprite crossfade. */
  crossfadeMs?: number;
  /** Original animation name in the pack ('tongue', 'attack_A', …) — audit trail. */
  source: string;
  /**
   * Ink bounds of this row's frames in cell coordinates — what the card has to fit. It is per
   * animation because poses differ wildly: the frog's tongue reaches ~3x its body, and fitting the
   * idle alone would spill the attack past the card edge, where it just disappears.
   */
  rect: { x: number; y: number; width: number; height: number };
}

/** The combined sheet an Admurin enemy renders from. */
export interface AdmurinEnemySheet {
  image: string;
  cellW: number;
  cellH: number;
  /** Small sprites the card scales UP (tecopena, MonoPixelArt): nearest-neighbour keeps them crisp. */
  pixelated?: boolean;
  animations: {
    idle: AdmurinEnemyAnimation;
    move?: AdmurinEnemyAnimation;
    hurt?: AdmurinEnemyAnimation;
    /** Attack rows in combat order; index matches EnemyData.attacks and lastEnemyAttackAtom.attackIndex. */
    attacks?: AdmurinEnemyAnimation[];
    ability?: AdmurinEnemyAnimation;
  };
}
