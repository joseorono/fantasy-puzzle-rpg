import type { CharacterData, EnemyData, OrbType } from './rpg-elements';
import type { GridPosition } from './geometry';

export type ActionTarget = 'party' | 'enemy';

export interface Orb {
  id: string;
  type: OrbType;
  row: number;
  col: number;
  isMatched?: boolean;
  isHighlighted?: boolean;
  /** Wildcard tile: matches with any color and explodes a 3x3 area when matched. */
  isBomb?: boolean;
}

export interface Match {
  orbs: Orb[];
  type: OrbType;
  count: number;
  multiplier: number;
}

export type BattleStatus = 'playing' | 'won' | 'lost';

export interface SkillActivationEvent {
  characterId: string;
  skillName: string;
  amount: number;
  isHeal: boolean;
  timestamp: number;
}

export interface BattleState {
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
   * Fires when an enemy reaches its per-cycle stagger (flinch) cap — the point where further hits
   * this cycle no longer delay its attack — so the per-enemy "STAGGER!" callout can replay. The
   * timestamp re-triggers the animation each time an enemy maxes out again on a later cycle.
   */
  lastMaxFlinch: { enemyId: string; timestamp: number } | null;
  /** `Date.now()` when the battle was created; drives the victory rating's clear-time criterion. */
  startedAt: number;
  /** Deepest cascade combo (chain length) reached this battle; feeds the victory rating. */
  maxCombo: number;
  /** Count of battle items consumed this battle; a penalty in the victory rating. */
  itemsUsed: number;
}
