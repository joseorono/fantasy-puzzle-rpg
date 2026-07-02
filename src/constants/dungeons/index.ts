import type { DungeonDefinition } from '~/types/dungeon';
import { SAMPLE_DUNGEON } from './sample-dungeon';

/**
 * Registry of all authored dungeons, keyed by `DungeonDefinition.id`.
 * Add new dungeon constants here so `getDungeonById` can resolve them.
 */
export const DUNGEONS: Record<string, DungeonDefinition> = {
  [SAMPLE_DUNGEON.id]: SAMPLE_DUNGEON,
};

export { SAMPLE_DUNGEON };
