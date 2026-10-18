import type { FoeDefinition } from '~/types/foe';
import { BAT_FOE_LOOK, SKELETON_FOE_LOOK, SLIME_FOE_LOOK } from '~/constants/enemies/world-00/foe-looks';

/**
 * Roaming enemies in the Apprentice Forge — weak ones, there to make the halls feel lived in.
 * Every waypoint is a walkable `road` tile (`foe-content.test.ts` checks); `patrol[0]` is the
 * home post. Each id keys an encounter in encounters.ts.
 */
export const APPRENTICE_FORGE_FOES: FoeDefinition[] = [
  {
    id: 'apprentice_forge_foe_1',
    name: 'Bats',
    ...BAT_FOE_LOOK,
    // The south hall, west of the entrance.
    patrol: [
      { row: 26, col: 10 },
      { row: 27, col: 20 },
      { row: 26, col: 14 },
    ],
  },
  {
    id: 'apprentice_forge_foe_2',
    name: 'Slimes',
    ...SLIME_FOE_LOOK,
    // The long north gallery.
    patrol: [
      { row: 2, col: 22 },
      { row: 2, col: 28 },
      { row: 7, col: 20 },
    ],
  },
  {
    id: 'apprentice_forge_foe_3',
    name: 'Skeleton',
    ...SKELETON_FOE_LOOK,
    // The central crossing between the west corridor and the east wing. The west post stays
    // out of detection range of the tutorial corridor, but close enough to the Slimes' range
    // that fleeing one north can run you into the other.
    patrol: [
      { row: 16, col: 20 },
      { row: 16, col: 30 },
      { row: 15, col: 12 },
    ],
  },
  {
    id: 'apprentice_forge_foe_4',
    name: 'Bats',
    ...BAT_FOE_LOOK,
    // The open east wing, circling the battle and the chest.
    patrol: [
      { row: 8, col: 34 },
      { row: 12, col: 42 },
      { row: 7, col: 40 },
    ],
  },
];
