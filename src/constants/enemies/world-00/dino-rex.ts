import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { createEmptyLootTable } from '~/types/loot';

export const DINO_REX_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/dino-rex_sheet.png',
  cellW: 384,
  cellH: 128,
  animations: {
    idle: { row: 0, frames: 5, frameDurationMs: 140, source: 'idle', rect: { x: 147, y: 44, width: 82, height: 84 } },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move', rect: { x: 147, y: 43, width: 82, height: 85 } },
    hurt: { row: 2, frames: 4, frameDurationMs: 80, source: 'hurt', rect: { x: 146, y: 42, width: 89, height: 86 } },
    attacks: [
      { row: 3, frames: 21, frameDurationMs: 70, source: 'attack_A', rect: { x: 131, y: 10, width: 194, height: 118 } },
      { row: 4, frames: 22, frameDurationMs: 70, source: 'attack_B', rect: { x: 106, y: 41, width: 133, height: 87 } },
      { row: 5, frames: 5, frameDurationMs: 70, source: 'stomp', rect: { x: 146, y: 41, width: 93, height: 87 } },
    ],
    ability: {
      row: 6,
      frames: 25,
      frameDurationMs: 80,
      source: 'ability',
      rect: { x: 147, y: 44, width: 104, height: 84 },
    },
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const DINO_REX_MAX_HP = calculateMaxHp(50, 40, 5); // TODO tune

export const DINO_REX: EnemyData = {
  id: 'dino-rex',
  name: 'Dino Rex',
  type: 'beast', // TODO tune (beast, golem, undead, humanoid…)
  stats: { pow: 10, vit: 40, spd: 0 }, // TODO tune
  vitHpMultiplier: 5, // TODO tune
  maxHp: DINO_REX_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/dino-rex_sheet.png',
  admurinSheet: DINO_REX_SHEET,
  spriteSize: 'lg', // suggested from the body size
  attackInterval: 4000, // TODO tune
  attackDamage: 24, // TODO tune
  guardBreak: 1, // TODO tune
  poise: 1, // TODO tune
  rarityBias: 0, // TODO tune
  expReward: calculateEnemyExpReward(DINO_REX_MAX_HP),
  lootTable: createEmptyLootTable(), // TODO tune
  attacks: [
    { name: 'Attack A', damageMultiplier: 1 },
    { name: 'Attack B', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
    { name: 'Stomp', damageMultiplier: 1 },
  ],
};

DINO_REX.currentHp = DINO_REX.maxHp;
