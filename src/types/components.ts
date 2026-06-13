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
  orb: Orb;
  isSelected: boolean;
  isInvalidSwap: boolean;
  isNew: boolean;
  /** True when this orb was destroyed by a bomb blast (plays the explosion animation). */
  isExploding: boolean;
  onSelect: () => void;
}
