import type { OrbType } from '~/types/rpg-elements';
import type { HpThreshold } from '~/lib/rpg-calculations';

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

// ─── HP Threshold Colors ────────────────────────────────────────────
// Maps from HpThreshold ('high' | 'medium' | 'low') to presentation values.
// Used with getHpThreshold() from ~/lib/rpg-calculations.

/** Tailwind bg classes for party HP bars (battle) */
export const HP_THRESHOLD_BG: Record<HpThreshold, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
};

/** Tailwind gradient classes for the collective party health bar (battle) */
export const HP_THRESHOLD_GRADIENT: Record<HpThreshold, string> = {
  high: 'from-green-600 to-green-500',
  medium: 'from-yellow-600 to-yellow-500',
  low: 'from-red-600 to-red-500',
};

/** Tailwind bg classes for enemy HP bars (battle) */
export const ENEMY_HP_THRESHOLD_BG: Record<HpThreshold, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-red-700',
};

/** Hex colors for inline-style HP bars (pause menu roster, etc.) */
export const HP_THRESHOLD_HEX: Record<HpThreshold, string> = {
  high: '#4ade80',
  medium: '#fbbf24',
  low: '#ef4444',
};

/** CSS class names for HP bars using .full/.medium/.low (town, pause menu) */
export const HP_THRESHOLD_CLASS: Record<HpThreshold, string> = {
  high: 'full',
  medium: 'medium',
  low: 'low',
};
