/**
 * Frosty RPG icon set — frostyrabbid 24×24 sprite sheet.
 *
 * Sprite sheet: 384×264 px → 16 cols × 11 rows, 24 px cells.
 *
 * Usage:
 *   <FrostyRpgIcon name="smallPotion" />           // native 24px
 *   <FrostyRpgIcon name="smallPotion" size={32} />  // scaled to 32px
 *   <FrostyRpgIcon name="copperKey" size={48} className="drop-shadow" />
 */

import { SpriteIcon, type SpriteSheetConfig } from './sprite-icon';

const CONFIG: SpriteSheetConfig = {
  image: '/assets/icons/rpg-icons-sprite-frostyrabbid-24x24.png',
  cellW: 24,
  cellH: 24,
  cols: 16, // 384 / 24
  rows: 11, // 264 / 24
};

/**
 * Icon name → [col, row] in the sprite grid.
 *
 * Organised by row, left-to-right, top-to-bottom.
 */
const ICON_MAP = {
  /* ── Row 0: Foraged plants ─────────────────────────────── */
  herb: [0, 0],
  fern: [1, 0],
  twigs: [2, 0],
  berrySprig: [3, 0],
  blueFlower: [4, 0],
  purpleHerb: [5, 0],
  driedHerb: [6, 0],
  redBerries: [7, 0],
  sprout: [8, 0],
  stone: [9, 0],
  root: [10, 0],
  redBlossom: [11, 0],
  bluebells: [12, 0],
  darkBerries: [13, 0],
  peaPod: [14, 0],
  turnip: [15, 0],

  /* ── Row 1: Metals / gems / ores ───────────────────────── */
  ironBar: [0, 1],
  copperBar: [1, 1],
  silverBar: [2, 1],
  goldBar: [3, 1],
  ruby: [4, 1],
  diamond: [5, 1],
  pinkGem: [6, 1],
  quartz: [7, 1],
  emerald: [8, 1],
  darkOre: [9, 1],
  greenOre: [10, 1],
  dustPile: [11, 1],
  opal: [12, 1],
  coral: [13, 1],
  prismShard: [14, 1],
  oreNuggets: [15, 1],

  /* ── Row 2: Creature parts / trophies ──────────────────── */
  rawSteak: [0, 2],
  roastMeat: [1, 2],
  pelt: [2, 2],
  wool: [3, 2],
  horn: [4, 2],
  batWing: [5, 2],
  bone: [6, 2],
  fang: [7, 2],
  kindling: [8, 2],
  skull: [9, 2],
  eye: [10, 2],
  feather: [11, 2],
  fairyDust: [12, 2],
  salamander: [13, 2],
  fishFin: [14, 2],
  tentacle: [15, 2],

  /* ── Row 3: Swords ─────────────────────────────────────── */
  ironSword: [0, 3],
  copperSword: [1, 3],
  steelSword: [2, 3],
  bronzeSword: [3, 3],
  gemDagger: [4, 3],
  flameSword: [5, 3],
  shadowSword: [6, 3],
  silverSword: [7, 3],
  frostScimitar: [8, 3],
  venomSword: [9, 3],
  darkSword: [10, 3],
  thornSword: [11, 3],
  azureBlade: [12, 3],
  crimsonSword: [13, 3],
  elvenSword: [14, 3],
  moltenSword: [15, 3],

  /* ── Row 4: Potions / bottles ──────────────────────────── */
  redVial: [0, 4],
  smallPotion: [1, 4],
  largePotion: [2, 4],
  blueVial: [3, 4],
  bluePotion: [4, 4],
  largeBluePotion: [5, 4],
  greenVial: [6, 4],
  greenPotion: [7, 4],
  largeGreenPotion: [8, 4],
  purplePotion: [9, 4],
  lovePotion: [10, 4],
  clayJug: [11, 4],
  flask: [12, 4],
  elixir: [13, 4],
  medicineBottle: [14, 4],
  amberBottle: [15, 4],

  /* ── Row 5: Documents / treasure ───────────────────────── */
  candle: [0, 5],
  walnut: [1, 5],
  copperKey: [2, 5],
  openBook: [3, 5],
  blueBook: [4, 5],
  ticket: [5, 5],
  crumpledPaper: [6, 5],
  pouch: [7, 5],
  letter: [8, 5],
  chalice: [9, 5],
  redBook: [10, 5],
  giftBox: [11, 5],
  parchment: [12, 5],
  sealedScroll: [13, 5],
  coinPurse: [14, 5],
  conch: [15, 5],

  /* ── Row 6: Bows ───────────────────────────────────────── */
  shortBow: [0, 6],
  huntingBow: [1, 6],
  ashBow: [2, 6],
  boneBow: [3, 6],
  frostBow: [4, 6],
  shadowBow: [5, 6],
  wingedBow: [6, 6],
  falconBow: [7, 6],
  leafBow: [8, 6],
  crimsonBow: [9, 6],
  vineBow: [10, 6],
  roseBow: [11, 6],
  stormBow: [12, 6],
  emberBow: [13, 6],
  forestBow: [14, 6],
  fairyBow: [15, 6],

  /* ── Row 7: Torso armor ────────────────────────────────── */
  clothShirt: [0, 7],
  paddedArmor: [1, 7],
  furCoat: [2, 7],
  silverArmor: [3, 7],
  rubyPlate: [4, 7],
  emeraldPlate: [5, 7],
  blueCoat: [6, 7],
  leatherRobe: [7, 7],
  bronzeArmor: [8, 7],
  leatherVest: [9, 7],
  plateArmor: [10, 7],
  guardArmor: [11, 7],
  shadowArmor: [12, 7],
  emberPlate: [13, 7],
  mysticArmor: [14, 7],
  goldArmor: [15, 7],

  /* ── Row 8: Axes / maces ───────────────────────────────── */
  hatchet: [0, 8],
  greatAxe: [1, 8],
  steelAxe: [2, 8],
  wingedAxe: [3, 8],
  rubyAxe: [4, 8],
  frostAxe: [5, 8],
  spikedMace: [6, 8],
  warAxe: [7, 8],
  leafAxe: [8, 8],
  crimsonAxe: [9, 8],
  darkAxe: [10, 8],
  skullAxe: [11, 8],
  flameAxe: [12, 8],
  mysticAxe: [13, 8],
  jadeAxe: [14, 8],
  copperAxe: [15, 8],

  /* ── Row 9: Staffs / wands / scepters ──────────────────── */
  woodStaff: [0, 9],
  copperWand: [1, 9],
  copperStaff: [2, 9],
  emberStaff: [3, 9],
  crystalStaff: [4, 9],
  fireStaff: [5, 9],
  lightningStaff: [6, 9],
  scepter: [7, 9],
  natureStaff: [8, 9],
  bloodStaff: [9, 9],
  thornStaff: [10, 9],
  sapphireStaff: [11, 9],
  crystalScepter: [12, 9],
  silverScepter: [13, 9],
  arcaneStaff: [14, 9],
  bronzeStaff: [15, 9],

  /* ── Row 10: Produce / curios ──────────────────────────── */
  snapdragon: [0, 10],
  slime: [1, 10],
  cherries: [2, 10],
  purpleCorn: [3, 10],
  braidedRing: [4, 10],
  corn: [5, 10],
  gourd: [6, 10],
  jellyfish: [7, 10],
  winterBerries: [8, 10],
  greenGourd: [9, 10],
  goldenBerries: [10, 10],
  anemone: [11, 10],
  acorn: [12, 10],
  grapes: [13, 10],
  cornucopia: [14, 10],
  magicFruit: [15, 10],
} as const satisfies Record<string, readonly [number, number]>;

/** Valid icon name for the frosty RPG sprite sheet. */
export type FrostyRpgIconName = keyof typeof ICON_MAP;

interface FrostyRpgIconProps {
  /** Icon name — autocompletes to valid keys from the sprite map. */
  name: FrostyRpgIconName;
  /** Rendered size in pixels (default = native 24px). */
  size?: number;
  /** Additional CSS classes. */
  className?: string;
}

export function FrostyRpgIcon({ name, size, className }: FrostyRpgIconProps) {
  return (
    <SpriteIcon
      name={name}
      size={size}
      className={className}
      config={CONFIG}
      iconMap={ICON_MAP}
    />
  );
}
