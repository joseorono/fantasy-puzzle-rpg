import type { townLocations } from '~/types/map-node';
import type { FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';

/** One row of the town Help panel: what a location is for, in a sentence. */
export interface TownHelpEntry {
  location: Exclude<townLocations, 'town-hub'>;
  title: string;
  description: string;
  iconName: FrostyRpgIconName;
}

/**
 * Explains each town location to a first-time visitor. Keyed to the same `townLocations`
 * union the hub navigates, so a new location can't be added to the signpost without a
 * matching entry here going missing being obvious.
 */
export const TOWN_HELP_ENTRIES: readonly TownHelpEntry[] = [
  {
    location: 'blacksmith',
    title: 'Blacksmith',
    description: 'Craft and upgrade equipment, salvage gear you no longer need, and exchange resources.',
    iconName: 'steelSword',
  },
  {
    location: 'inn',
    title: 'Inn',
    description: "Rest to restore your heroes' HP. Wounded heroes cost coins to heal — the more hurt, the more it costs.",
    iconName: 'chalice',
  },
  {
    location: 'item-store',
    title: 'Item Shop',
    description: "Buy consumables for battle, or sell the ones you're not using for half their value.",
    iconName: 'smallPotion',
  },
];
