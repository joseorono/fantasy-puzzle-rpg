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
  /** Original animation name in the pack ('tongue', 'attack_A', …) — audit trail. */
  source: string;
}

/** The combined sheet an Admurin enemy renders from. */
export interface AdmurinEnemySheet {
  image: string;
  cellW: number;
  cellH: number;
  /**
   * Ink bounds of the idle row in cell coordinates — where the character actually is. The art sits
   * at the bottom of a frame with a lot of empty headroom, so the card is fitted to this rect (and
   * the cell crops around it), not to the whole cell.
   */
  characterRect: { x: number; y: number; width: number; height: number };
  animations: {
    idle: AdmurinEnemyAnimation;
    move?: AdmurinEnemyAnimation;
    hurt?: AdmurinEnemyAnimation;
    /** Attack rows in combat order; index matches EnemyData.attacks and lastEnemyAttackAtom.attackIndex. */
    attacks?: AdmurinEnemyAnimation[];
    ability?: AdmurinEnemyAnimation;
  };
}
