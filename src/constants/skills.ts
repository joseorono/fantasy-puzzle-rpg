import type { CharacterClass } from '~/types/rpg-elements';

export type SkillTarget = 'enemy' | 'ally';

export interface SkillDefinition {
  name: string;
  description: string;
  icon: string;
  baseDamageMultiplier: number;
  flatDamageBonus: number;
  target: SkillTarget;
}

/** Base damage value used for skill calculations */
export const BASE_SKILL_DAMAGE = 15;

/** Seconds of cooldown reduction per matched orb of a character's color */
export const COOLDOWN_REDUCTION_PER_ORB = 0.3;

export const SKILL_DEFINITIONS: Record<CharacterClass, SkillDefinition> = {
  warrior: {
    name: 'Power Strike',
    description: 'A heavy blow dealing massive POW-scaled damage.',
    icon: '⚔️',
    baseDamageMultiplier: 2,
    flatDamageBonus: 0,
    target: 'enemy',
  },
  rogue: {
    name: 'Assassinate',
    description: 'A precise strike with moderate damage plus a burst of flat bonus damage.',
    icon: '🗡️',
    baseDamageMultiplier: 1,
    flatDamageBonus: 30,
    target: 'enemy',
  },
  mage: {
    name: 'Arcane Blast',
    description: 'Unleashes a devastating blast of arcane energy.',
    icon: '✨',
    baseDamageMultiplier: 3,
    flatDamageBonus: 0,
    target: 'enemy',
  },
  healer: {
    name: 'Divine Heal',
    description: 'Heals the most damaged ally with a powerful restorative spell.',
    icon: '💚',
    baseDamageMultiplier: 2,
    flatDamageBonus: 0,
    target: 'ally',
  },
};
