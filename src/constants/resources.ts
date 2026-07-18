/**
 * Resources constants
 */

import type { Resources } from '~/types/resources';
import type { FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';

/**
 * Initial resources state
 */
export const INITIAL_RESOURCES_STATE: Resources = {
  coins: 10,
  gold: 0,
  copper: 0,
  silver: 0,
  iron: 0,
};

/** Maps each resource key to its FrostyRpgIcon sprite name. */
export const RESOURCE_ICON_NAMES = {
  coins: 'coinPurse',
  gold: 'goldBar',
  silver: 'silverBar',
  iron: 'ironBar',
  copper: 'copperBar',
} as const satisfies Record<keyof Resources, FrostyRpgIconName>;

/** Maps each resource key to its human-readable label. */
export const RESOURCE_LABELS = {
  coins: 'Coins',
  gold: 'Gold',
  silver: 'Silver',
  iron: 'Iron',
  copper: 'Copper',
} as const satisfies Record<keyof Resources, string>;

/** Canonical order resources are displayed in across the UI. */
export const RESOURCE_DISPLAY_ORDER = ['coins', 'gold', 'silver', 'iron', 'copper'] as const satisfies ReadonlyArray<
  keyof Resources
>;
