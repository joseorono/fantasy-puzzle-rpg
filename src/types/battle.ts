import type { CharacterData, EnemyData, OrbType } from './rpg-elements';
import type { GridPosition } from './geometry';

export type ActionTarget = 'party' | 'enemy';

export interface Orb {
  id: string;
  type: OrbType;
  row: number;
  col: number;
  /** Wildcard tile: matches with any color and explodes a 3x3 area when matched. */
  isBomb?: boolean;
}

/** An adjacent-orb swap, as found by the move search or requested by the player. */
export interface OrbSwap {
  from: GridPosition;
  to: GridPosition;
}

/** Which axis a line-clear item wipes. */
export type LineOrientation = 'row' | 'column';

/** A line-clear item the player has armed and is aiming with. */
export interface ArmedLineClear {
  itemId: string;
  orientation: LineOrientation;
}

/**
 * A fired line clear waiting on the board. Deliberately carries only the line, not the orb ids:
 * the board resolves it once it settles, so a clear fired mid-cascade never targets orbs that
 * have since fallen away.
 */
export interface LineClearRequest {
  orientation: LineOrientation;
  index: number;
  timestamp: number;
}

export interface Match {
  orbs: Orb[];
  type: OrbType;
  count: number;
  multiplier: number;
}

/** `abandoned` is a fight the player walked out of — only training allows it. Over, like won/lost. */
export type BattleStatus = 'playing' | 'won' | 'lost' | 'abandoned';

/** `training`: a reward-free sparring fight — no standby, no attacks, no item consumption, leavable. */
export type BattleMode = 'standard' | 'training';

export interface SkillActivationEvent {
  characterId: string;
  skillName: string;
  amount: number;
  isHeal: boolean;
  timestamp: number;
}

/** One enemy's posture pool and Break windows. Math lives in `~/lib/poise-system`. */
export interface EnemyPoiseState {
  /** Remaining poise; hits subtract from it. `<= 0` never persists — a Break refills it. */
  current: number;
  /** Current (possibly escalated) max poise. */
  max: number;
  /** Max poise at battle start; the escalation cap is relative to this. */
  originalMax: number;
  /** Breaks suffered this battle. Never resets mid-battle. */
  breakCount: number;
  /** `> 0` = Broken: attack cancelled, vulnerable. Counted down by the battle tick. */
  staggerRemainingMs: number;
  /** `> 0` = poise damage ignored (HP damage and Flinch still land). Counted down by the battle tick. */
  immuneRemainingMs: number;
}

/** The three player-facing phases of a poise pool, in the order a Break walks through them. */
export type EnemyPoisePhase = 'ready' | 'broken' | 'immune';

/**
 * A poise pool reduced to the integer percents the poise bar and the training readout draw, so a
 * subscriber only re-renders when something *visible* moved — with regen on, the underlying state
 * changes on every tick for as long as a pool is dented. Built by `summarizeEnemyPoise`.
 */
export interface EnemyPoiseSummary {
  phase: EnemyPoisePhase;
  /** Remaining poise, 0–100. Reads 100 while Broken or immune, since a Break refills the pool. */
  fillPercent: number;
  /** Remaining stagger window (Broken) or immunity window (immune), 0–100; 0 while ready. */
  windowPercent: number;
  /** Breaks suffered this battle. */
  breakCount: number;
  /** Where the original max sits on the escalated bar, 0–100, or null until the pool has escalated. */
  originalMaxPercent: number | null;
}

export interface BattleState {
  mode: BattleMode;
  party: CharacterData[];
  enemies: EnemyData[];
  selectedEnemyId: string;
  board: Orb[][];
  selectedOrb: GridPosition | null;
  currentMatches: Match[];
  score: number;
  turn: number;
  /** Party-wide Guard meter (0..GUARD_MAX). Charged by matching gray orbs; mitigates enemy attacks. */
  guard: number;
  gameStatus: BattleStatus;
  /**
   * True from the killing blow until the board settles, when all enemies are dead but the
   * in-flight cascade is still resolving. Keeps `gameStatus: 'playing'` so the combo chain
   * finishes and fully counts toward the victory rating; the settle branch then commits the win.
   */
  pendingVictory: boolean;
  lastDamage: {
    amount: number;
    target: ActionTarget;
    timestamp: number;
    characterId?: string;
    enemyId?: string;
    /** Multiple targets hit at once (e.g. an all-enemy skill). Each id flinches. */
    enemyIds?: string[];
    /** Individual hits folded into this event (a multi-color match). Absent = one hit of `amount`. */
    hits?: Array<{ amount: number; characterId?: string }>;
    /**
     * Per-target amounts when one event hit several enemies for different values (an all-enemy
     * skill landing on a mix of staggered and unbroken targets). Falls back to `amount`.
     */
    amountByEnemyId?: Record<string, number>;
    /** What produced the hit. A missing value is treated as `'match'` by consumers. */
    source?: 'match' | 'skill' | 'enemy';
    /** Set when the incoming party hit was mitigated by Guard. */
    wasGuarded?: boolean;
    /** Set when Guard fully blocked the incoming hit. */
    blocked?: boolean;
  } | null;
  lastMatchedType: OrbType | null;
  enemyAttackTimestamp?: number | null;
  lastSkillActivation: SkillActivationEvent | null;
  /**
   * Per-enemy start-of-battle standby delay (ms), keyed by enemy id. Generated once when
   * the battle is created; each enemy waits this long "observing" before its attack loop
   * begins, so attacks fan out instead of firing in unison. See {@link generateEnemyStandbyDelays}.
   */
  enemyStandbyMs: Record<string, number>;
  /**
   * Ids of enemies still on their standby (observing, not yet attacking). Maintained by the
   * attack-timer hook as each standby elapses; a hit on one of these lands as a "preemptive
   * strike" (bonus damage). Initialized to every enemy with a non-zero standby delay.
   */
  standbyEnemyIds: string[];
  /**
   * Fires when a hit lands on a still-observing enemy, so the centered "Preemptive Strike!"
   * callout can replay. The timestamp re-triggers the animation on repeat strikes.
   */
  lastPreemptiveStrike: { timestamp: number } | null;
  /**
   * Fires when a refill left a board with no match and no legal move, so it was fully
   * reshuffled (colors and bombs preserved). Drives the "No moves! Reshuffle!" callout.
   */
  lastReshuffle: { timestamp: number } | null;
  /**
   * Fires when an enemy reaches its per-cycle stagger (flinch) cap — the point where further hits
   * this cycle no longer delay its attack — so the per-enemy "STAGGER!" callout can replay. The
   * timestamp re-triggers the animation each time an enemy maxes out again on a later cycle.
   */
  lastMaxFlinch: { enemyId: string; timestamp: number } | null;
  /**
   * Per-enemy poise (posture) pool and Break windows, keyed by enemy id. Written in the same
   * commit as HP damage; the stagger/immunity counters are ticked down by `battleTickAtom`.
   * See `~/lib/poise-system` and docs/ENEMY_POISE_STAGGER.md.
   */
  enemyPoise: Record<string, EnemyPoiseState>;
  /**
   * Fires when one or more enemies Break (poise pool emptied → attack cancelled), so the per-enemy
   * "Staggered!" callout can replay. An all-enemy skill can break several at once.
   */
  lastPoiseBreak: { enemyIds: string[]; timestamp: number } | null;
  /** `Date.now()` when the battle was created; drives the victory rating's clear-time criterion. */
  startedAt: number;
  /** Deepest cascade combo (chain length) reached this battle; feeds the victory rating. */
  maxCombo: number;
  /** Count of battle items consumed this battle; a penalty in the victory rating. */
  itemsUsed: number;
  /** Count of ultimate skills activated this battle; a capped bonus in the victory rating. */
  ultimateSkillsUsed: number;
  /** Every point of damage landed on enemies this battle, matches and skills alike. */
  totalDamageDealt: number;
}
