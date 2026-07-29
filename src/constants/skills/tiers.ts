import type { Resources } from '~/types/resources';
import { createResources } from '~/lib/resources';

/**
 * Tier gates for both skill kinds, calibrated against the polynomial EXP curve
 * (`~/constants/progression`) for a ~level-30, ~3 hour campaign.
 * Full pacing table: docs/ideas-proposals/SKILL_ROSTER.md §1–§2.
 */

/** Level floor for each Active tier (0–3). Tier 0 = starting skill, owned from level 1. */
export const ACTIVE_TIER_LEVELS = [1, 7, 14, 21] as const;

/**
 * Resource price of each Active tier (0–3), identical across classes. Reaching the
 * level only makes the skill purchasable — unlocking costs this at the Skills tab.
 * Tier 0 is free: every hero must always own an Ultimate. Cheaper than the passive
 * track: actives are the class kit, passives the luxury.
 */
export const ACTIVE_TIER_COSTS: readonly Resources[] = [
  createResources(),
  createResources({ coins: 100, iron: 5 }),
  createResources({ coins: 250, silver: 5 }),
  createResources({ coins: 400, silver: 5, gold: 5 }),
];

/** Level floor for each Passive tier (1–4). Passives also cost resources. */
export const PASSIVE_TIER_LEVELS = [4, 10, 17, 24] as const;

/**
 * Resource price of each Passive tier (1–4), identical across classes.
 * Leans on crafting metals so passives compete with equipment for materials —
 * given how quickly early levels arrive, the cost is the real pacing lever.
 */
export const PASSIVE_TIER_COSTS: readonly Resources[] = [
  createResources({ coins: 150, iron: 5 }),
  createResources({ coins: 300, iron: 10, silver: 5 }),
  createResources({ coins: 500, silver: 10, gold: 5 }),
  createResources({ coins: 800, silver: 15, gold: 10 }),
];
