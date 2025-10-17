export type OrbColor = 'blue' | 'green' | 'purple' | 'yellow' | 'gray';

export interface Orb {
  id: string;
  color: OrbColor;
  row: number;
  col: number;
  isMatched?: boolean;
  isHighlighted?: boolean;
}

export interface Character {
  id: string;
  name: string;
  class: 'warrior' | 'rogue' | 'mage' | 'healer';
  color: OrbColor;
  maxHp: number;
  currentHp: number;
  skillCooldown: number;
  maxCooldown: number;
}

export interface Enemy {
  id: string;
  name: string;
  type: string;
  maxHp: number;
  currentHp: number;
  sprite: string;
  attackInterval?: number;
  attackDamage?: number;
}

export interface Match {
  orbs: Orb[];
  color: OrbColor;
  count: number;
  multiplier: number;
}

export interface BattleState {
  party: Character[];
  enemy: Enemy;
  board: Orb[][];
  selectedOrb: { row: number; col: number } | null;
  currentMatches: Match[];
  score: number;
  turn: number;
  gameStatus: 'playing' | 'won' | 'lost';
  lastDamage: { amount: number; target: 'party' | 'enemy'; timestamp: number; characterId?: string } | null;
  lastMatchedColor: OrbColor | null;
  enemyAttackTimestamp?: number | null;
}
