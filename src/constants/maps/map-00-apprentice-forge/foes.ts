import type { FoeDefinition } from '~/types/foe';

const BAT_MAP_SPRITE = '/assets/enemy-sprites/tecopena-bat_map.png';
const SLIME_MAP_SPRITE = '/assets/enemy-sprites/tecopena-slime_map.png';
const SKELETON_MAP_SPRITE = '/assets/enemy-sprites/monopixelart-skeleton_map.png';

/**
 * Roaming enemies in the Apprentice Forge — weak ones, there to make the halls feel lived in.
 * Every waypoint is a walkable `road` tile (`foe-content.test.ts` checks); `patrol[0]` is the
 * home post. Each id keys an encounter in encounters.ts.
 */
export const APPRENTICE_FORGE_FOES: FoeDefinition[] = [
  {
    id: 'apprentice_forge_foe_1',
    name: 'Bats',
    mapSprite: BAT_MAP_SPRITE,
    // The long north gallery.
    patrol: [
      { row: 2, col: 22 },
      { row: 2, col: 28 },
      { row: 7, col: 20 },
    ],
  },
  {
    id: 'apprentice_forge_foe_2',
    name: 'Slimes',
    mapSprite: SLIME_MAP_SPRITE,
    // The south hall, west of the entrance.
    patrol: [
      { row: 26, col: 10 },
      { row: 27, col: 20 },
      { row: 26, col: 14 },
    ],
  },
  {
    id: 'apprentice_forge_foe_3',
    name: 'Skeleton',
    mapSprite: SKELETON_MAP_SPRITE,
    // The central crossing between the west corridor and the east wing. The west post stays
    // out of detection range of the tutorial corridor, but close enough to the Bats' range
    // that fleeing one north can run you into the other.
    patrol: [
      { row: 16, col: 20 },
      { row: 16, col: 30 },
      { row: 15, col: 12 },
    ],
  },
];
