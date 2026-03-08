/**
 * Frosty RPG icon set — frostyrabbid 24×24 sprite sheet.
 *
 * Sprite sheet: 384×264 px → 16 cols × 11 rows, 24 px cells.
 *
 * Usage:
 *   <FrostyRpgIcon name="smallPotion" />           // native 24px
 *   <FrostyRpgIcon name="smallPotion" size={32} />  // scaled to 32px
 *   <FrostyRpgIcon name="goldKey" size={48} className="drop-shadow" />
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
  /* ── Row 0: Nature / materials ─────────────────────────── */
  herb: [0, 0],
  fern: [1, 0],
  berries: [2, 0],
  flower: [3, 0],
  mushroom: [4, 0],
  feather: [5, 0],
  leaf: [6, 0],
  acorn: [7, 0],
  blueCrystal: [8, 0],
  redCrystal: [9, 0],
  purpleCrystal: [10, 0],
  darkHerb: [11, 0],
  root: [12, 0],
  herbBundle: [13, 0],
  clover: [14, 0],
  seedPod: [15, 0],

  /* ── Row 1: Adventure / misc items ─────────────────────── */
  ironBar: [0, 1],
  copperBar: [1, 1],
  silverBar: [2, 1],
  goldBar: [3, 1],
  silverKey: [4, 1],
  egg: [5, 1],
  amethyst: [6, 1],
  bone: [7, 1],
  pinkPotion: [8, 1],
  quill: [9, 1],
  compass: [10, 1],
  candle: [11, 1],
  bell: [12, 1],
  fang: [13, 1],
  claw: [14, 1],
  ring: [15, 1],

  /* ── Row 2: Food / treasure ────────────────────────────── */
  apple: [0, 2],
  meat: [1, 2],
  bread: [2, 2],
  cheese: [3, 2],
  fish: [4, 2],
  pie: [5, 2],
  candy: [6, 2],
  greenBottle: [7, 2],
  blueBottle: [8, 2],
  skull: [9, 2],
  jar: [10, 2],
  bomb: [11, 2],
  coins: [12, 2],
  coinStack: [13, 2],
  chalice: [14, 2],
  giftBox: [15, 2],

  /* ── Row 3: Swords / daggers (tier 1) ──────────────────── */
  rustySword: [0, 3],
  shortSword: [1, 3],
  broadsword: [2, 3],
  longSword: [3, 3],
  dagger: [4, 3],
  knifeBlue: [5, 3],
  scimitar: [6, 3],
  rapier: [7, 3],
  katana: [8, 3],
  flameSword: [9, 3],
  iceSword: [10, 3],
  poisonDagger: [11, 3],
  goldDagger: [12, 3],
  silverDagger: [13, 3],
  sai: [14, 3],
  kunai: [15, 3],

  /* ── Row 4: Potions / tools ────────────────────────────── */
  ironSword: [0, 4],
  smallPotion: [1, 4],
  largePotion: [2, 4],
  bluePotion: [3, 4],
  greenPotion: [4, 4],
  yellowPotion: [5, 4],
  purplePotion: [6, 4],
  vial: [7, 4],
  flask: [8, 4],
  wrench: [9, 4],
  pickaxe: [10, 4],
  shovel: [11, 4],
  bucket: [12, 4],
  lantern: [13, 4],
  torch: [14, 4],
  rope: [15, 4],

  /* ── Row 5: Books / magic / treasure ───────────────────── */
  bookRed: [0, 5],
  bookBlue: [1, 5],
  bookGreen: [2, 5],
  openBook: [3, 5],
  orbRed: [4, 5],
  orbBlue: [5, 5],
  orbGreen: [6, 5],
  orbPurple: [7, 5],
  amulet: [8, 5],
  necklace: [9, 5],
  crown: [10, 5],
  tiara: [11, 5],
  chest: [12, 5],
  openChest: [13, 5],
  coinPurse: [14, 5],
  fireShard: [15, 5],

  /* ── Row 6: Axes / hammers / bows ──────────────────────── */
  hatchet: [0, 6],
  axe: [1, 6],
  battleAxe: [2, 6],
  doubleAxe: [3, 6],
  hammer: [4, 6],
  warHammer: [5, 6],
  mace: [6, 6],
  flail: [7, 6],
  shortBow: [8, 6],
  longbow: [9, 6],
  recurveBow: [10, 6],
  compositeBow: [11, 6],
  reflexBow: [12, 6],
  huntingBow: [13, 6],
  greatbow: [14, 6],
  warBow: [15, 6],

  /* ── Row 7: Armor / clothing ───────────────────────────── */
  leatherArmor: [0, 7],
  chainmail: [1, 7],
  ironArmor: [2, 7],
  steelArmor: [3, 7],
  robe: [4, 7],
  mageRobe: [5, 7],
  plateArmor: [6, 7],
  goldArmor: [7, 7],
  leatherHelm: [8, 7],
  ironHelm: [9, 7],
  steelHelm: [10, 7],
  goldHelm: [11, 7],
  hood: [12, 7],
  wizardHat: [13, 7],
  crown2: [14, 7],
  shield: [15, 7],

  /* ── Row 8: Polearms / staves ──────────────────────────── */
  spear: [0, 8],
  pike: [1, 8],
  halberd: [2, 8],
  trident: [3, 8],
  woodStaff: [4, 8],
  ironStaff: [5, 8],
  mageStaff: [6, 8],
  crystalStaff: [7, 8],
  wand: [8, 8],
  scepter: [9, 8],
  runeStaff: [10, 8],
  fireStaff: [11, 8],
  iceStaff: [12, 8],
  lightningStaff: [13, 8],
  holyStaff: [14, 8],
  darkStaff: [15, 8],

  /* ── Row 9: Throwing / small weapons ───────────────────── */
  arrow: [0, 9],
  fireArrow: [1, 9],
  iceArrow: [2, 9],
  poisonArrow: [3, 9],
  bolt: [4, 9],
  throwingKnife: [5, 9],
  shuriken: [6, 9],
  dart: [7, 9],
  blowgun: [8, 9],
  whip: [9, 9],
  chain: [10, 9],
  hookshot: [11, 9],
  net: [12, 9],
  trap: [13, 9],
  smokeBomb: [14, 9],
  flashBomb: [15, 9],

  /* ── Row 10: Large / special weapons ───────────────────── */
  greatSword: [0, 10],
  claymore: [1, 10],
  flamberge: [2, 10],
  zweihander: [3, 10],
  scythe: [4, 10],
  sickle: [5, 10],
  cane: [6, 10],
  club: [7, 10],
  morningstar: [8, 10],
  lance: [9, 10],
  glaive: [10, 10],
  naginata: [11, 10],
  fan: [12, 10],
  orb: [13, 10],
  tome: [14, 10],
  grimoire: [15, 10],
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
