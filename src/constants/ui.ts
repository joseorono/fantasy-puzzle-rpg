import type { OrbType } from '~/types/rpg-elements';
import type { HpThreshold } from '~/lib/rpg-calculations';

// Orb type classes for styling
export const ORB_TYPE_CLASSES: Record<OrbType, string> = {
  blue: '[--orb-color:#3b82f6] [--orb-img:url(/assets/orbs/orb_blue.png)]',
  green: '[--orb-color:#22c55e] [--orb-img:url(/assets/orbs/orb_green.png)]',
  purple: '[--orb-color:#a855f7] [--orb-img:url(/assets/orbs/orb_purple.png)]',
  yellow: '[--orb-color:#eab308] [--orb-img:url(/assets/orbs/orb_yellow.png)]',
  red: '[--orb-color:#ef4444] [--orb-img:url(/assets/orbs/orb_red.png)]',
};

// Orb glow effects
export const ORB_GLOW_CLASSES: Record<OrbType, string> = {
  blue: 'shadow-[0_0_20px_rgba(59,130,246,0.8)]',
  green: 'shadow-[0_0_20px_rgba(34,197,94,0.8)]',
  purple: 'shadow-[0_0_20px_rgba(168,85,247,0.8)]',
  yellow: 'shadow-[0_0_20px_rgba(234,179,8,0.8)]',
  red: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]',
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
