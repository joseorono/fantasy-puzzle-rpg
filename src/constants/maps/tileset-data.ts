import type { TilemapTileset } from '~/types/tilemap';

/**
 * Tileset descriptors shared by the Tiled exports in `src/constants/maps/*\/tiled-data.ts`.
 *
 * A Tiled export embeds its tileset inline, so every map that draws from the same sheet
 * repeats the same block. Each sheet gets one constant here instead, and a map's
 * `tiled-data.ts` sets `tilesets: [TILESET_X]`.
 *
 * `image` holds the **runtime** path (served from `public/`), not the `../public/...`
 * path Tiled writes on export — map configs read it for their `tilesetImage`, so the
 * sheet is named in exactly one place. Tiled's authoring metadata (`tiledversion`,
 * `type`, `version`) is dropped; nothing reads it.
 *
 * `src/lib/map-draw.ts` reads `columns`, `tilewidth`, `tileheight`, `margin`, `spacing`
 * and `firstgid` off `tilesets[0]` to slice tiles out of the sheet, so those must match
 * the real image.
 */

/** 512×512 @ 16px — the original overworld sheet (`map-00`). */
export const TILESET_DEMO_MAP: TilemapTileset = {
  columns: 32,
  firstgid: 1,
  image: '/assets/tileset/demo-map.png',
  imageheight: 512,
  imagewidth: 512,
  margin: 0,
  name: 'snow',
  spacing: 0,
  tilecount: 1024,
  tileheight: 16,
  tilewidth: 16,
};

/** 400×400 @ 16px — dungeon interiors (`map-01`). */
export const TILESET_DEMO_MAP_2: TilemapTileset = {
  columns: 25,
  firstgid: 1,
  image: '/assets/tileset/demo-map-2.png',
  imageheight: 400,
  imagewidth: 400,
  margin: 0,
  name: 'Tiles',
  spacing: 0,
  tilecount: 625,
  tileheight: 16,
  tilewidth: 16,
};

/** 800×800 @ 32px — Apprentice Forge. Note the 32px tiles: maps using it need a `characterBodyHeightTiles` override. */
export const TILESET_FORGE: TilemapTileset = {
  columns: 25,
  firstgid: 1,
  image: '/assets/tileset/pc-forge-tileset.png',
  imageheight: 800,
  imagewidth: 800,
  margin: 0,
  name: 'pc-forge-tileset',
  spacing: 0,
  tilecount: 625,
  tileheight: 32,
  tilewidth: 32,
};

/** 1248×2048 @ 16px — Fairy Forest. */
export const TILESET_FAIRY_FOREST: TilemapTileset = {
  columns: 78,
  firstgid: 1,
  image: '/assets/tileset/pc-fairy-forest.png',
  imageheight: 2048,
  imagewidth: 1248,
  margin: 0,
  name: 'pc-fairy-forest',
  spacing: 0,
  tilecount: 9984,
  tileheight: 16,
  tilewidth: 16,
};

/** 480×480 @ 16px — Castle Garden. */
export const TILESET_CASTLE_GARDEN: TilemapTileset = {
  columns: 30,
  firstgid: 1,
  image: '/assets/tileset/pc-garden-tileset.png',
  imageheight: 480,
  imagewidth: 480,
  margin: 0,
  name: 'pc-garden-tileset',
  spacing: 0,
  tilecount: 900,
  tileheight: 16,
  tilewidth: 16,
  // Fully transparent tiles of pc-garden-tileset.png (480x480, 30 cols, firstgid 1).
  // Transparent tiles draw nothing, so they must be skipped when finding the visible
  // top tile. Regenerate by scanning the tileset PNG alpha channel.
  blankGids: [
    12, 16, 21, 25, 26, 30, 51, 55, 81, 85, 111, 115, 126, 127, 128, 130, 139, 140, 141, 145, 156, 157, 158, 169, 170,
    184, 185, 186, 187, 191, 199, 200, 206, 207, 208, 211, 216, 222, 226, 229, 230, 236, 237, 252, 256, 259, 260, 266,
    267, 284, 289, 290, 296, 297, 303, 304, 313, 314, 315, 326, 327, 333, 334, 337, 341, 344, 356, 357, 370, 371, 386,
    387, 400, 401, 416, 417, 421, 426, 430, 431, 446, 447, 451, 456, 457, 458, 460, 461, 462, 466, 467, 469, 476, 477,
    490, 492, 495, 496, 497, 499, 506, 507, 513, 514, 525, 526, 527, 529, 536, 537, 542, 543, 544, 545, 547, 548, 560,
    566, 567, 573, 574, 589, 590, 591, 592, 594, 596, 597, 607, 608, 620, 621, 622, 631, 636, 637, 638, 649, 650, 651,
    652, 658, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 672, 680, 681, 682, 691, 692, 693, 694, 704, 709, 710,
    711, 712, 734, 740, 741, 742, 743, 745, 746, 747, 761, 763, 764, 769, 770, 771, 772, 773, 794, 795, 796, 797, 798,
    799, 800, 801, 802, 803, 809, 810, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 843, 846, 849, 851, 853, 854,
    855, 856, 857, 858, 859, 860, 861, 873, 876, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891,
  ],
  // The stone archway gate over the road into the fountain plaza. These tiles draw
  // over live road but have a transparent opening, so the player walks under them.
  overheadGids: [189, 219, 249, 822],
};
