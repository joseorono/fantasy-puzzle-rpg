/*
 * Equipment rarity constants.
 *
 * A rolled rarity tier is attached to each *instance* of equipment (per inventory
 * stack / per equipped slot), never to the static item definition — the same
 * `iron-sword` can roll Common one time and Epic the next. Everything tunable about
 * rarity lives here so balance can be tweaked in one place.
 */

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Tiers ordered from lowest to highest. The index doubles as the tier's "rank". */
export const RARITY_TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

/** Fallback rarity for any equipment instance that predates / omits a rolled tier. */
export const DEFAULT_RARITY: RarityTier = 'common';

export const RARITY_LABELS: Record<RarityTier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/**
 * Stat scaling per tier. Applied to an item's positive POW/VIT/SPD values only
 * (penalties are left untouched — see `scaleStat`) so a higher rarity never makes
 * a stat worse. Baked into stats once at equip / battle-init, never per frame.
 */
export const RARITY_STAT_MULTIPLIER: Record<RarityTier, number> = {
  common: 1.0,
  uncommon: 1.1,
  rare: 1.25,
  epic: 1.4,
  legendary: 1.6,
};

/**
 * Muted / warm palette tuned to the parchment UI — the single source of truth for
 * rarity color. Deliberately desaturated (no neon, no `#ffd700` gold).
 */
export const RARITY_COLORS: Record<RarityTier, string> = {
  common: '#9a958c', // stone grey
  uncommon: '#7e9c6b', // sage green
  rare: '#6f8db0', // dusty blue
  epic: '#8a6fa6', // muted violet
  legendary: '#c08a3e', // warm amber / bronze
};

/**
 * Base drop weights for a neutral roll (enemy `rarityBias` of 0). Relative, not
 * percentages — `rollRarity` normalizes them.
 */
export const BASE_RARITY_WEIGHTS: Record<RarityTier, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

/**
 * How strongly an enemy's `rarityBias` inflates higher tiers. A tier's effective
 * weight is `base * (1 + bias * tierIndex * RARITY_BIAS_FACTOR)`, so bias only
 * lifts the rarer tiers and `bias === 0` reproduces `BASE_RARITY_WEIGHTS` exactly.
 */
export const RARITY_BIAS_FACTOR = 0.5;

/** Bias applied to crafted gear. 0 = same odds as a neutral drop; tweak to taste. */
export const CRAFTING_RARITY_BIAS = 0;

/** Bias applied to treasure-chest loot. */
export const CHEST_RARITY_BIAS = 1;

/*
 * Crafting "pity" — consecutive unlucky crafts build luck toward rarer gear.
 * A craft that rolls below PITY_RESET_TIER increments the pity counter; a craft
 * at or above it resets the counter to 0. The counter feeds a rising bias into
 * the next craft's roll: bias = CRAFTING_RARITY_BIAS + min(pity, PITY_MAX) * PITY_BIAS_STEP.
 */

/** Extra rarity bias granted per accumulated pity point. */
export const PITY_BIAS_STEP = 0.5;

/** Pity counter is clamped here so the bias can't run away. */
export const PITY_MAX = 20;

/** A craft rolling below this tier builds pity; rolling at/above it resets pity. */
export const PITY_RESET_TIER: RarityTier = 'rare';
