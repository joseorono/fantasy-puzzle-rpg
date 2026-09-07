import type { Resources } from '~/types/resources';
import { createResources } from '~/lib/resources';
import { ACTIVE_TIER_LEVELS, PASSIVE_TIER_LEVELS } from './tiers';

/**
 * Skill-level pacing for both skill kinds. Every skill levels 1..maxLevel;
 * levels 2–3 are small steps and level 4 is the earned capstone jump.
 * Stat values per level are hand-authored in each class file — these constants
 * carry only the shared economy (costs) and character-level gates.
 */

/** Default number of levels per skill. Level 4 is the capstone. */
export const DEFAULT_SKILL_MAX_LEVEL = 4;

/**
 * Character-level offsets (added to a skill's `unlockLevel`) gating skill levels
 * 2 / 3 / 4. Kept tight so every gate lands BELOW the next tier's unlock level —
 * a skill finishes leveling before the following skill opens (registry-tested).
 */
export const SKILL_LEVEL_GATE_OFFSETS = [2, 4, 5] as const;

/** Character-level gates for Active skill levels 2/3/4, by tier (0–3). */
export const ACTIVE_LEVEL_GATES: readonly (readonly number[])[] = ACTIVE_TIER_LEVELS.map((unlockLevel) =>
  SKILL_LEVEL_GATE_OFFSETS.map((offset) => unlockLevel + offset),
);

/** Character-level gates for Passive skill levels 2/3/4, by tier (1–4), indexed `[tier - 1]`. */
export const PASSIVE_LEVEL_GATES: readonly (readonly number[])[] = PASSIVE_TIER_LEVELS.map((unlockLevel) =>
  SKILL_LEVEL_GATE_OFFSETS.map((offset) => unlockLevel + offset),
);

/**
 * Upgrade price for Active skill levels 2/3/4, by tier (0–3). The capstone costs
 * roughly double the mid step. Tier-0 upgrades are the one paid way to improve
 * the free starter skill.
 */
export const ACTIVE_UPGRADE_COSTS: readonly (readonly Resources[])[] = [
  [
    createResources({ coins: 60, iron: 3 }),
    createResources({ coins: 130, iron: 6 }),
    createResources({ coins: 300, silver: 5, gold: 2 }),
  ],
  [
    createResources({ coins: 120, iron: 5 }),
    createResources({ coins: 220, silver: 3 }),
    createResources({ coins: 450, silver: 8, gold: 3 }),
  ],
  [
    createResources({ coins: 200, silver: 3 }),
    createResources({ coins: 330, silver: 6 }),
    createResources({ coins: 600, silver: 10, gold: 5 }),
  ],
  [
    createResources({ coins: 300, silver: 5, gold: 2 }),
    createResources({ coins: 480, silver: 8, gold: 4 }),
    createResources({ coins: 800, silver: 12, gold: 8 }),
  ],
];

/**
 * Upgrade price for Passive skill levels 2/3/4, by tier (1–4), indexed `[tier - 1]`.
 * Pricier than actives, mirroring the unlock-cost relationship.
 */
export const PASSIVE_UPGRADE_COSTS: readonly (readonly Resources[])[] = [
  [
    createResources({ coins: 90, iron: 4 }),
    createResources({ coins: 180, iron: 8 }),
    createResources({ coins: 400, silver: 6, gold: 3 }),
  ],
  [
    createResources({ coins: 180, iron: 6 }),
    createResources({ coins: 300, silver: 5 }),
    createResources({ coins: 550, silver: 10, gold: 4 }),
  ],
  [
    createResources({ coins: 280, silver: 5 }),
    createResources({ coins: 450, silver: 8 }),
    createResources({ coins: 750, silver: 12, gold: 6 }),
  ],
  [
    createResources({ coins: 400, silver: 8, gold: 3 }),
    createResources({ coins: 650, silver: 12, gold: 6 }),
    createResources({ coins: 1000, silver: 18, gold: 12 }),
  ],
];
