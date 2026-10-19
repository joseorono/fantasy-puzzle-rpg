import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { BROWN_WOLF_LOOT } from './loot-tables';

// Rects are full cell height so every pose shares the same vertical anchor: the wolf shrinks in
// place during attacks instead of riding up toward the top of the card.
export const BROWN_WOLF_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/brown-wolf_sheet.png',
  cellW: 48,
  cellH: 32,
  pixelated: true,
  animations: {
    idle: { row: 0, frames: 3, frameDurationMs: 140, source: 'idle', rect: { x: 4, y: 0, width: 34, height: 32 } },
    hurt: { row: 1, frames: 6, frameDurationMs: 80, source: 'hurt', rect: { x: 4, y: 0, width: 42, height: 32 } },
    attacks: [
      { row: 2, frames: 6, frameDurationMs: 70, source: 'attack_a', rect: { x: 3, y: 0, width: 43, height: 32 } },
      { row: 3, frames: 6, frameDurationMs: 70, source: 'attack_b', rect: { x: 3, y: 0, width: 45, height: 32 } },
    ],
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const BROWN_WOLF_MAX_HP = calculateMaxHp(50, 25, 4); // 150 HP

export const BROWN_WOLF: EnemyData = {
  id: 'brown-wolf',
  name: 'Brown Wolf',
  type: 'beast',
  stats: { pow: 12, vit: 25, spd: 25 },
  vitHpMultiplier: 4,
  maxHp: BROWN_WOLF_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/brown-wolf_sheet.png',
  admurinSheet: BROWN_WOLF_SHEET,
  spriteSize: 'md',
  attackInterval: 3200, // ~2.56s after SPD — a quick predator
  attackDamage: 12, // Base damage before POW modifier (14 after POW)
  guardBreak: 1,
  poise: 1.2, // Nimble, but not a stone wall
  rarityBias: 0,
  expReward: calculateEnemyExpReward(BROWN_WOLF_MAX_HP), // 31
  lootTable: BROWN_WOLF_LOOT,
  attacks: [
    { name: 'Bite', damageMultiplier: 1 },
    { name: 'Pounce', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

BROWN_WOLF.currentHp = BROWN_WOLF.maxHp;
