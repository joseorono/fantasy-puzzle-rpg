import type { CharacterData, EnemyData, OrbColor } from './rpg-elements';

export type ActionTarget = 'party' | 'enemy';

export interface Orb {
  id: string;
  color: OrbColor;
  row: number;
  col: number;
  isMatched?: boolean;
  isHighlighted?: boolean;
}


export interface Match {
  orbs: Orb[];
  color: OrbColor;
  count: number;
  multiplier: number;
}

export type BattleStatus = 'playing' | 'won' | 'lost';

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
  lastMatchedColor: OrbColor | null;
  enemyAttackTimestamp?: number | null;
}
