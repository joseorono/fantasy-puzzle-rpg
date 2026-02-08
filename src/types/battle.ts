import type { CharacterData, EnemyData, OrbType } from './rpg-elements';

export type ActionTarget = 'party' | 'enemy';

export interface Orb {
  id: string;
  type: OrbType;
  row: number;
  col: number;
  isMatched?: boolean;
  isHighlighted?: boolean;
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
  enemy: EnemyData;
  board: Orb[][];
  selectedOrb: { row: number; col: number } | null;
  currentMatches: Match[];
  score: number;
  turn: number;
  gameStatus: BattleStatus;
  lastDamage: { amount: number; target: ActionTarget; timestamp: number; characterId?: string } | null;
  lastMatchedType: OrbType | null;
  enemyAttackTimestamp?: number | null;
  lastSkillActivation: SkillActivationEvent | null;
}
