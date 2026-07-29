import type { Resources } from '~/types/resources';
import { createResources } from '~/lib/resources';

/**
 * Tier gates for both skill kinds, calibrated against the polynomial EXP curve
 * (`~/constants/progression`) for a ~level-30, ~3 hour campaign.
 * Full pacing table: docs/ideas-proposals/SKILL_ROSTER.md §1–§2.
 */

/** Level at which each Active tier (0–3) auto-unlocks, free. Tier 0 = starting skill. */
export const ACTIVE_TIER_LEVELS = [1, 7, 14, 21] as const;

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
