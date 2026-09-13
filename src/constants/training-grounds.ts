/*
 * Training Grounds tunables
 *
 * The respec fee climbs with every respec the save has already paid for
 * (`progressFlags.respecCount`), so a respec stays repeatable but never free.
 * The curve is computed from the two constants below; rebalancing means editing
 * a number here, never a call site.
 */

import type { Resources } from '~/types/resources';
import { createResources } from '~/lib/resources';

/** Coins charged for the very first respec on a save. */
export const RESPEC_BASE_COST = 50;

/** Coins added to the fee for each respec already paid for. */
export const RESPEC_COST_STEP = 50;

/**
 * Coin cost of the next respec, given how many the save has paid for so far.
 *
 * @param respecCount - Respecs already performed on this save
 * @returns The fee as a full `Resources` line (coins only)
 */
export function getRespecCost(respecCount: number): Resources {
  return createResources({ coins: RESPEC_BASE_COST + RESPEC_COST_STEP * Math.max(0, respecCount) });
}
