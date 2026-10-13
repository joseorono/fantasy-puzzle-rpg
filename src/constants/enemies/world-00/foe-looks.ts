import type { FoeLook } from '~/types/foe';
import {
  FROGGER_MAP_STRIP,
  MONOPIXELART_SKELETON_MAP_STRIP,
  TECOPENA_BAT_MAP_STRIP,
  TECOPENA_SLIME_MAP_STRIP,
} from './foe-map-strips';

/** Map look of each world-00 FOE kind; spread into a `FoeDefinition`. */

export const BAT_FOE_LOOK: FoeLook = {
  mapSprite: '/assets/enemy-sprites/tecopena-bat_map.png',
  mapStrip: TECOPENA_BAT_MAP_STRIP,
  // A flier: a soft bob reads as fluttering, a full hop does not.
  walkTween: 0.5,
};

export const SLIME_FOE_LOOK: FoeLook = {
  mapSprite: '/assets/enemy-sprites/tecopena-slime_map.png',
  mapStrip: TECOPENA_SLIME_MAP_STRIP,
};

export const SKELETON_FOE_LOOK: FoeLook = {
  mapSprite: '/assets/enemy-sprites/monopixelart-skeleton_map.png',
  mapStrip: MONOPIXELART_SKELETON_MAP_STRIP,
};

export const FROG_FOE_LOOK: FoeLook = {
  mapSprite: '/assets/enemy-sprites/frogger_map.png',
  mapStrip: FROGGER_MAP_STRIP,
};

/** No animation frames at all, so it walks on the default tween. */
export const STONE_GOLEM_FOE_LOOK: FoeLook = {
  mapSprite: '/assets/enemy-sprites/stone_golem_map.png',
};
