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
 * `src/components/map/tile-map.tsx` reads `columns`, `tilewidth`, `tileheight` and
 * `firstgid` off `tilesets[0]` to slice tiles out of the sheet, so those must match the
 * real image.
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
