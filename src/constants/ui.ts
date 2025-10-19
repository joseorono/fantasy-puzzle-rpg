import type { OrbType } from '~/types/rpg-elements';
import { Sword, Zap, Sparkles, Heart } from 'lucide-react';

// Character icons mapping
export const CHARACTER_ICONS = {
  warrior: Sword,
  rogue: Zap,
  mage: Sparkles,
  healer: Heart,
} as const;

// Character color themes
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

// Health bar colors by orb type
export const HEALTH_BAR_COLORS: Record<OrbType, string> = {
  blue: 'from-blue-600 to-blue-500',
  green: 'from-green-600 to-green-500',
  purple: 'from-purple-600 to-purple-500',
  yellow: 'from-yellow-600 to-yellow-500',
  gray: 'from-gray-600 to-gray-500',
};

// Orb type classes for styling
export const ORB_TYPE_CLASSES: Record<OrbType, string> = {
  blue: 'bg-blue-500 shadow-blue-600 border-blue-400',
  green: 'bg-green-500 shadow-green-600 border-green-400',
  purple: 'bg-purple-500 shadow-purple-600 border-purple-400',
  yellow: 'bg-yellow-500 shadow-yellow-600 border-yellow-400',
  gray: 'bg-gray-400 shadow-gray-500 border-gray-300',
};

// Orb glow effects
export const ORB_GLOW_CLASSES: Record<OrbType, string> = {
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.8)]',
  green: 'shadow-[0_0_20px_rgba(34,197,94,0.8)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.8)]',
  yellow: 'shadow-[0_0_20px_rgba(234,179,8,0.8)]',
  gray: 'shadow-[0_0_20px_rgba(156,163,175,0.5)]',
};
