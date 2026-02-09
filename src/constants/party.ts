import type { CharacterData, OrbType, CharacterClass } from '~/types/rpg-elements';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { calculateExpToNextLevel } from '~/lib/leveling-system';
import { MOSS_GOLEM, SWAMP_FROG } from './enemies/world-00';
import { Sword, Zap, Sparkles, Heart } from 'lucide-react';

// ─── RPG Configuration ───────────────────────────────────────────────

export const BASE_MATCH_DAMAGE = 10; // Base damage for match-3

// Default EXP needed for level 1 characters
export const EXP_TO_LEVEL_ONE = calculateExpToNextLevel(1);
export const LEVELING_UP_HEALS_CHARACTER = true;

// ─── Initial Party Setup ─────────────────────────────────────────────
// Stats: POW (damage), VIT (HP), SPD (cooldown speed), vitHpMultiplier (HP scaling)

const partyBase: CharacterData[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    stats: {
      pow: 6,
      vit: 20,
      spd: 5,
    },
    potentialStats: {
      pow: 30,
      vit: 30,
      spd: 10,
    },
    level: 1,
    baseHp: 50,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 6, // Tanky - highest HP scaling
    maxHp: calculateMaxHp(50, 20, 6),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 30,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    class: 'rogue',
    color: 'green',
    stats: {
      pow: 20,
      vit: 10,
      spd: 25,
    },
    potentialStats: {
      pow: 45,
      vit: 5,
      spd: 20,
    },
    level: 1,
    baseHp: 40,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 3, // Glass cannon - lowest HP scaling
    maxHp: calculateMaxHp(40, 10, 3),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 20,
  },
  {
    id: 'mage',
    name: 'Mage',
    class: 'mage',
    color: 'purple',
    stats: {
      pow: 25,
      vit: 8,
      spd: 10,
    },
    potentialStats: {
      pow: 35,
      vit: 12,
      spd: 17,
    },
    level: 1,
    baseHp: 35,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 4, // Fragile - low HP scaling
    maxHp: calculateMaxHp(35, 8, 4),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 50,
  },
  {
    id: 'healer',
    name: 'Healer',
    class: 'healer',
    color: 'yellow',
    stats: {
      pow: 10,
      vit: 18,
      spd: 12,
    },
    potentialStats: {
      pow: 13,
      vit: 40,
      spd: 17,
    },
    level: 1,
    baseHp: 45,
    expToNextLevel: EXP_TO_LEVEL_ONE,
    vitHpMultiplier: 5, // Balanced - moderate HP scaling
    maxHp: calculateMaxHp(45, 18, 5),
    currentHp: 0,
    skillCooldown: 0,
    maxCooldown: 60,
  },
];

export const INITIAL_PARTY: CharacterData[] = partyBase.map((char) => ({
  ...char,
  currentHp: char.maxHp,
}));

// Initial enemy party setup
export const INITIAL_ENEMIES = [
  MOSS_GOLEM,
  { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
  { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
];

// ─── Character Icons ─────────────────────────────────────────────────

export const CHARACTER_ICONS = {
  warrior: Sword,
  rogue: Zap,
  mage: Sparkles,
  healer: Heart,
} as const;

// ─── Character Colors ────────────────────────────────────────────────

export const CHARACTER_COLORS = {
  warrior: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-100',
    glow: 'shadow-blue-500/50',
    gradient: 'from-blue-700 to-blue-600',
    icon: 'text-blue-200',
  },
  rogue: {
    bg: 'bg-green-600',
    border: 'border-green-500',
    text: 'text-green-100',
    glow: 'shadow-green-500/50',
    gradient: 'from-green-700 to-green-600',
    icon: 'text-green-200',
  },
  mage: {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    text: 'text-purple-100',
    glow: 'shadow-purple-500/50',
    gradient: 'from-purple-700 to-purple-600',
    icon: 'text-purple-200',
  },
  healer: {
    bg: 'bg-yellow-600',
    border: 'border-yellow-500',
    text: 'text-yellow-100',
    glow: 'shadow-yellow-500/50',
    gradient: 'from-yellow-700 to-yellow-600',
    icon: 'text-yellow-200',
  },
} as const;

// Character colors for battle UI (party display sprites, cooldown bars)
export const CHARACTER_BATTLE_COLORS = {
  warrior: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    glow: 'shadow-[0_0_20px_rgba(37,99,235,0.6)]',
    text: 'text-blue-300',
    cooldown: 'bg-blue-400',
  },
  rogue: {
    bg: 'bg-green-600',
    border: 'border-green-500',
    glow: 'shadow-[0_0_20px_rgba(22,163,74,0.6)]',
    text: 'text-green-300',
    cooldown: 'bg-green-400',
  },
  mage: {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.6)]',
    text: 'text-purple-300',
    cooldown: 'bg-purple-400',
  },
  healer: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]',
    text: 'text-yellow-300',
    cooldown: 'bg-yellow-400',
  },
} as const;

// ─── Skill Burst Overlay ─────────────────────────────────────────────

export const SKILL_BURST_DURATION_MS = 650;

export const SKILL_BURST_COLORS: Record<CharacterClass, { bg: string; light: string }> = {
  warrior: { bg: 'rgba(37, 99, 235, 0.85)', light: 'rgba(147, 197, 253, 0.5)' },
  rogue: { bg: 'rgba(22, 163, 74, 0.85)', light: 'rgba(134, 239, 172, 0.5)' },
  mage: { bg: 'rgba(147, 51, 234, 0.85)', light: 'rgba(216, 180, 254, 0.5)' },
  healer: { bg: 'rgba(202, 138, 4, 0.85)', light: 'rgba(253, 224, 71, 0.5)' },
};

// ─── Health Bar Colors ───────────────────────────────────────────────

export const HEALTH_BAR_COLORS: Record<OrbType, string> = {
  blue: 'from-blue-600 to-blue-500',
  green: 'from-green-600 to-green-500',
  purple: 'from-purple-600 to-purple-500',
  yellow: 'from-yellow-600 to-yellow-500',
  gray: 'from-gray-600 to-gray-500',
};

// ─── Skills ──────────────────────────────────────────────────────────

export type SkillTarget = 'enemy' | 'ally' | 'allAlly';

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
    description: 'Heals all party members with a powerful restorative spell.',
    icon: '💚',
    baseDamageMultiplier: 2,
    flatDamageBonus: 0,
    target: 'allAlly',
  },
};
