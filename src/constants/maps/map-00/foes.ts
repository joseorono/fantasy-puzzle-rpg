import type { FoeDefinition } from '~/types/foe';
import { STONE_GOLEM_FOE_LOOK } from '~/constants/enemies/world-00/foe-looks';

/**
 * Roaming enemies on the overworld. Every waypoint is a walkable `road` tile
 * (`foe-content.test.ts` checks); `patrol[0]` is the home post. Each id keys an
 * encounter in encounters.ts.
 */
export const MAP_00_FOES: FoeDefinition[] = [
  {
    id: 'overworld_foe_1',
    name: 'Stone Golem',
    ...STONE_GOLEM_FOE_LOOK,
    // The corridor mouth above the Ancient Chest (31, 16) and Hidden Treasure Chest (25, 16).
    patrol: [
      { row: 23, col: 14 },
      { row: 23, col: 19 },
      { row: 28, col: 16 },
    ],
  },
];
