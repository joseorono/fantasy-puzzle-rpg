import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { createEmptyLootTable } from '~/types/loot';

export const DINO_TRI_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/dino-tri_sheet.png',
  cellW: 384,
  cellH: 128,
  animations: {
    idle: { row: 0, frames: 6, frameDurationMs: 140, source: 'idle', rect: { x: 168, y: 67, width: 106, height: 61 } },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move', rect: { x: 162, y: 66, width: 112, height: 62 } },
    attacks: [
      { row: 2, frames: 30, frameDurationMs: 70, source: 'attack_A', rect: { x: 147, y: 45, width: 237, height: 83 } },
      { row: 3, frames: 30, frameDurationMs: 70, source: 'attack_B', rect: { x: 147, y: 45, width: 237, height: 83 } },
    ],
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const DINO_TRI_MAX_HP = calculateMaxHp(50, 40, 5); // TODO tune

export const DINO_TRI: EnemyData = {
  id: 'dino-tri',
  name: 'Dino Tri',
  type: 'beast', // TODO tune (beast, golem, undead, humanoid…)
  stats: { pow: 10, vit: 40, spd: 0 }, // TODO tune
  vitHpMultiplier: 5, // TODO tune
  maxHp: DINO_TRI_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/dino-tri_sheet.png',
  admurinSheet: DINO_TRI_SHEET,
  spriteSize: 'xl', // suggested from the body size
  attackInterval: 4000, // TODO tune
  attackDamage: 24, // TODO tune
  guardBreak: 1, // TODO tune
  poise: 1, // TODO tune
  rarityBias: 0, // TODO tune
  expReward: calculateEnemyExpReward(DINO_TRI_MAX_HP),
  lootTable: createEmptyLootTable(), // TODO tune
  attacks: [
    { name: 'Attack A', damageMultiplier: 1 },
    { name: 'Attack B', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

DINO_TRI.currentHp = DINO_TRI.maxHp;
