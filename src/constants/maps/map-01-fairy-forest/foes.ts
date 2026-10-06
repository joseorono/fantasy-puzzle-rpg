import type { FoeDefinition } from '~/types/foe';

const STONE_GOLEM_MAP_SPRITE = '/assets/enemy-sprites/stone_golem_map.png';

/**
 * Roaming enemies on the Fairy Forest trail, one guarding each far chest. Every waypoint
 * is a walkable `road` tile (`foe-content.test.ts` checks); `patrol[0]` is the home post.
 * Each id keys an encounter in encounters.ts.
 */
export const FAIRY_FOREST_FOES: FoeDefinition[] = [
  {
    id: 'fairy_forest_foe_1',
    name: 'Stone Golem',
    mapSprite: STONE_GOLEM_MAP_SPRITE,
    // Willow Hollow — the north-west dead end, chest at (0, 1).
    patrol: [
      { row: 1, col: 5 },
      { row: 2, col: 9 },
      { row: 0, col: 7 },
    ],
  },
  {
    id: 'fairy_forest_foe_2',
    name: 'Stone Golem',
    mapSprite: STONE_GOLEM_MAP_SPRITE,
    // Fairy Cache — the north-east pocket, chest at (21, 104).
    patrol: [
      { row: 23, col: 100 },
      { row: 21, col: 99 },
      { row: 25, col: 97 },
    ],
  },
  {
    id: 'fairy_forest_foe_3',
    name: 'Stone Golem',
    mapSprite: STONE_GOLEM_MAP_SPRITE,
    // Thornwood — the east pocket, chest at (55, 113).
    patrol: [
      { row: 53, col: 111 },
      { row: 55, col: 116 },
      { row: 52, col: 108 },
    ],
  },
];
