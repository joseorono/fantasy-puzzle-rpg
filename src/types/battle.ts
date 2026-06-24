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
}
