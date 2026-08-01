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

/** Minimum opacity for party stats icons; remaining opacity scales with fill percentage up to 1. */
export const PARTY_STATS_ICON_MIN_OPACITY = 0.6;

/** Visual dimming filter used by low/empty party stats icons, aligned with the pause menu icon language. */
export const PARTY_STATS_ICON_DIM_FILTER = 'grayscale(0.3) brightness(0.6) contrast(1.2)';

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

/** HP threshold → IndigolayBar colour variant, shared by every HP bar on the art. */
export const HP_THRESHOLD_BAR_VARIANT = {
  high: 'green',
  medium: 'yellow',
  low: 'red',
} as const;

/**
 * Orb type → IndigolayBar colour variant, for the battle party HP bar, which tints
 * to the last matched orb. The pack ships no grey fill, so `gray` maps to `slate`
 * (desaturated sky-blue) — though the bar's own logic never passes gray through.
 */
export const ORB_TYPE_BAR_VARIANT: Record<OrbType, 'blue' | 'green' | 'purple' | 'yellow' | 'slate'> = {
  blue: 'blue',
  green: 'green',
  purple: 'purple',
  yellow: 'yellow',
  gray: 'slate',
};

/** Custom pixel-art info badge used by the level-up stat tooltips. */
export const INFO_ICON_SRC = '/assets/icons/ui/info-badge.svg';

/**
 * How long the cursor must rest on a skill slot before its hover card opens.
 * Tooltips are instant everywhere else (`TooltipProvider` defaults to 0), but the
 * skill slots sit in rows of four — without a pause, sweeping the track flashes a
 * full card per slot.
 */
export const SKILL_SLOT_TOOLTIP_DELAY_MS = 250;

/**
 * Denominator for the level-up stat meters — the notional stat ceiling, used for bar
 * width only. Not a gameplay cap; nothing clamps stats to this value.
 */
export const STAT_METER_MAX = 100;

/**
 * Press-and-hold auto-repeat tuning for the +/- stat-allocation buttons (level-up screen).
 * Holding a button spends/refunds points ever faster: after `initialDelayMs`, each repeat's wait
 * shrinks by `accelerationFactor` toward `minIntervalMs`. A plain click still does exactly one
 * (the hold train never fires on press — the button's onClick handles the single step).
 */
export const STAT_BUTTON_HOLD = {
  /** Wait before the first auto-repeat, so a quick click doesn't trigger the train. */
  initialDelayMs: 350,
  /** Fastest repeat interval the acceleration can reach. */
  minIntervalMs: 28,
  /** Each repeat multiplies the wait by this (< 1 = accelerate). */
  accelerationFactor: 0.82,
} as const;
