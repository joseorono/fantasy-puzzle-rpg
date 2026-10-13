import type { FoeDefinition } from '~/types/foe';
import {
  BAT_FOE_LOOK,
  FROG_FOE_LOOK,
  SLIME_FOE_LOOK,
  STONE_GOLEM_FOE_LOOK,
} from '~/constants/enemies/world-00/foe-looks';

// The only frog sprite: Swamp Frog packs wear the Giant Frog's.
const SWAMP_FROG_FOE_LOOK = FROG_FOE_LOOK;

/**
 * Roaming enemies on the Fairy Forest trail, weakest first in walking order; the giants and
 * golems hold remote pockets and can outclass the Badger. Every waypoint is a walkable `road`
 * tile (`foe-content.test.ts` checks); `patrol[0]` is the home post.
 * Each id keys an encounter in encounters.ts.
 */
export const FAIRY_FOREST_FOES: FoeDefinition[] = [
  // ─── Main path ──────────────────────────────────────────────────────
  {
    id: 'fairy_forest_foe_6',
    name: 'Bats',
    ...BAT_FOE_LOOK,
    // The start pocket, around Thornfield.
    patrol: [
      { row: 63, col: 99 },
      { row: 62, col: 105 },
      { row: 66, col: 104 },
    ],
  },
  {
    id: 'fairy_forest_foe_7',
    name: 'Swamp Frogs',
    ...SWAMP_FROG_FOE_LOOK,
    // The south-east column, up toward Fernwall.
    patrol: [
      { row: 60, col: 85 },
      { row: 68, col: 87 },
      { row: 74, col: 82 },
    ],
  },
  {
    id: 'fairy_forest_foe_8',
    name: 'Swamp Frogs',
    ...SWAMP_FROG_FOE_LOOK,
    // The central-east hub, between Sunmoss and the eastern band.
    patrol: [
      { row: 45, col: 72 },
      { row: 51, col: 78 },
      { row: 46, col: 86 },
    ],
  },
  {
    id: 'fairy_forest_foe_4',
    name: 'Bats',
    ...BAT_FOE_LOOK,
    // The open glade around the Rootbound Den.
    patrol: [
      { row: 25, col: 52 },
      { row: 33, col: 52 },
      { row: 33, col: 62 },
    ],
  },
  {
    id: 'fairy_forest_foe_11',
    name: 'Slimes',
    ...SLIME_FOE_LOOK,
    // The western clearing, past Glade Gate.
    patrol: [
      { row: 45, col: 26 },
      { row: 41, col: 36 },
      { row: 47, col: 31 },
    ],
  },
  {
    id: 'fairy_forest_foe_12',
    name: 'Giant Frog',
    ...FROG_FOE_LOOK,
    // The west lobe, past Thistle Gate.
    patrol: [
      { row: 30, col: 11 },
      { row: 24, col: 18 },
      { row: 33, col: 9 },
    ],
    overrides: { detectionRadiusTiles: 8 },
  },

  // ─── Side regions ───────────────────────────────────────────────────
  {
    id: 'fairy_forest_foe_3',
    name: 'Giant Frog',
    ...FROG_FOE_LOOK,
    // Thornwood — the east pocket, chest at (55, 113). The swamp's biggest frog holds this one.
    patrol: [
      { row: 53, col: 111 },
      { row: 55, col: 116 },
      { row: 52, col: 108 },
    ],
    // A giant notices the player from farther out than the golems do.
    overrides: { detectionRadiusTiles: 8 },
  },
  {
    id: 'fairy_forest_foe_2',
    name: 'Stone Golem',
    ...STONE_GOLEM_FOE_LOOK,
    // Fairy Cache — the north-east pocket, chest at (21, 104).
    patrol: [
      { row: 23, col: 100 },
      { row: 21, col: 99 },
      { row: 25, col: 97 },
    ],
  },
  {
    id: 'fairy_forest_foe_9',
    name: 'Slimes',
    ...SLIME_FOE_LOOK,
    // The north band, behind Canopy Gate, on the way to the Elder Treant.
    patrol: [
      { row: 11, col: 92 },
      { row: 9, col: 100 },
      { row: 13, col: 106 },
    ],
  },
  {
    id: 'fairy_forest_foe_5',
    name: 'Slimes',
    ...SLIME_FOE_LOOK,
    // The south hollow, behind Mire Gate, between its two battles.
    patrol: [
      { row: 63, col: 45 },
      { row: 63, col: 60 },
      { row: 66, col: 50 },
    ],
  },
  {
    id: 'fairy_forest_foe_10',
    name: 'Swamp Frogs',
    ...SWAMP_FROG_FOE_LOOK,
    // The south hollow's western end, around Toadstool Grove.
    patrol: [
      { row: 69, col: 36 },
      { row: 64, col: 40 },
      { row: 72, col: 38 },
    ],
  },
  {
    id: 'fairy_forest_foe_1',
    name: 'Stone Golem',
    ...STONE_GOLEM_FOE_LOOK,
    // Willow Hollow, past the Badger — kept clear of the exit and its arrival tile.
    patrol: [
      { row: 1, col: 14 },
      { row: 3, col: 17 },
      { row: 0, col: 18 },
    ],
  },
];
