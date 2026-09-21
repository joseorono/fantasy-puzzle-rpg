import type { ActionTarget, Orb } from './battle';
import type { CharacterData } from './rpg-elements';

// Damage Display Component
export interface DamageDisplayProps {
  amount: number;
  type: 'damage' | 'heal' | 'critical';
  className?: string;
}

// Damage Number Component
export interface DamageNumberProps {
  target: ActionTarget;
}

// Character Sprite Component
export interface CharacterSpriteProps {
  character: CharacterData;
  onActivateSkill?: (characterId: string) => void;
}

// Orb Component
export interface OrbComponentProps {
  /** The board's own orb object — passed through unchanged so the compiler can cache on it. */
  orb: Orb;
  isSelected: boolean;
  /** True while this orb is part of a resolving match (glow + ping, then the disappear spin). */
  isHighlighted: boolean;
  isInvalidSwap: boolean;
  /** True when this orb is half of the idle-hint swap (muted pulsing ring). */
  isHint: boolean;
  isNew: boolean;
  /** True when this orb was destroyed by a bomb blast (plays the explosion animation). */
  isExploding: boolean;
  /** True when this orb sits on the line a armed line-clear item is currently aimed at. */
  isAimed: boolean;
  /** True while aiming elsewhere: the orb recedes so the aimed line reads clearly. */
  isDimmed: boolean;
  /** Shared board click handler; the orb reports its own coordinates. */
  onSelect: (row: number, col: number) => void;
  /** Shared board hover handler, used to aim line-clear items. */
  onHover: (row: number, col: number) => void;
}
