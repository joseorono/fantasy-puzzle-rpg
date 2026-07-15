import type { DungeonDefinition } from '~/types/dungeon';
import { MOSS_GOLEM, SWAMP_FROG } from '~/constants/enemies/world-00';
import { ANCIENT_CHEST_LOOT } from '~/constants/maps/map-00/loot-tables';
import { DUNGEON_BG_IMAGES } from '~/constants/dungeon-backgrounds';

const [CAVE_BG_1, CAVE_BG_2] = DUNGEON_BG_IMAGES;

/**
 * A short, low-stakes dungeon for exercising the run loop end-to-end — two floors, both combat,
 * with the boss floor ending on a chest so the chest-loot → clear-overlay hand-off can be verified.
 * Reuses existing enemies and the ancient-chest loot table. Floor 1 `[combat]`, Floor 2 boss
 * `[combat, chest]` (both floors are rated, so the clear overlay shows two per-floor rows).
 */
export const EASY_DUNGEON: DungeonDefinition = {
  id: 'easy-dungeon',
  name: 'Easy Dungeon',
  backgroundImage: CAVE_BG_1,
  floors: [
    {
      id: 'easy-floor-1',
      name: 'Floor 1 — Shallow Den',
      events: [
        {
          type: 'combat',
          encounter: {
            enemies: [{ ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog' }],
          },
        },
      ],
    },
    {
      id: 'easy-floor-2',
      name: 'Floor 2 — Lone Sentinel',
      backgroundImage: CAVE_BG_2,
      isBoss: true,
      events: [
        {
          type: 'combat',
          encounter: {
            enemies: [{ ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem' }],
          },
        },
        { type: 'chest', loot: ANCIENT_CHEST_LOOT },
      ],
    },
  ],
};
