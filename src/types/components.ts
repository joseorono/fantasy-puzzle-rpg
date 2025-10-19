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
}

// Orb Component
export interface OrbComponentProps {
  orb: Orb;
  isSelected: boolean;
  isInvalidSwap: boolean;
  isNew: boolean;
  onSelect: () => void;
}
