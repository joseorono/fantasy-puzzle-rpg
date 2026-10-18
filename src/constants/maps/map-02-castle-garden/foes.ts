import type { FoeDefinition } from '~/types/foe';
import { RIDER_FOE_LOOK } from '~/constants/enemies/world-00/foe-looks';

/**
 * Roaming enemies in the Castle Garden. Every waypoint is a walkable `road` tile
 * (`foe-content.test.ts` checks); `patrol[0]` is the home post.
 * Each id keys an encounter in encounters.ts.
 */
export const CASTLE_GARDEN_FOES: FoeDefinition[] = [
  {
    id: 'castle_garden_foe_1',
    name: 'Rider',
    ...RIDER_FOE_LOOK,
    // The central plaza, sweeping the main crossing on horseback.
    patrol: [
      { row: 52, col: 48 },
      { row: 52, col: 87 },
      { row: 58, col: 87 },
      { row: 58, col: 48 },
    ],
    // A horse: long sight and short pauses; its pace comes from the look's `fast` tier.
    overrides: {
      detectionRadiusTiles: 7,
      waypointPauseSeconds: 0.5,
    },
  },
];
