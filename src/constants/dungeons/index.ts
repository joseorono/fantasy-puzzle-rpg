import type { DungeonDefinition } from '~/types/dungeon';
import { SAMPLE_DUNGEON } from './sample-dungeon';
import { EASY_DUNGEON } from './easy-dungeon';

/**
 * Registry of all authored dungeons, keyed by `DungeonDefinition.id`.
 * Add new dungeon constants here so `getDungeonById` can resolve them.
 */
export const DUNGEONS: Record<string, DungeonDefinition> = {
  [SAMPLE_DUNGEON.id]: SAMPLE_DUNGEON,
  [EASY_DUNGEON.id]: EASY_DUNGEON,
};

export { SAMPLE_DUNGEON, EASY_DUNGEON };
