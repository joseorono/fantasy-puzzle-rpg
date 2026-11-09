import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { MINOTAUR_LOOT } from './loot-tables';

export const MINOTAUR_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/minotaur_sheet.png',
  cellW: 96,
  cellH: 101,
  pixelated: true,
  animations: {
    // Reverse through the middle poses before wrapping so the breathing loop has no hard reset.
    idle: {
      row: 0,
      frames: 5,
      frameDurationMs: 140,
      frameSequence: [0, 1, 2, 3, 4, 3, 2, 1],
      source: 'idle',
      rect: { x: 28, y: 53, width: 52, height: 42 },
    },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move', rect: { x: 25, y: 51, width: 56, height: 44 } },
    hurt: { row: 2, frames: 3, frameDurationMs: 80, source: 'hurt', rect: { x: 28, y: 54, width: 52, height: 41 } },
    attacks: [
      { row: 3, frames: 9, frameDurationMs: 70, source: 'attack_a', rect: { x: 5, y: 36, width: 82, height: 65 } },
      { row: 4, frames: 9, frameDurationMs: 70, source: 'attack_b', rect: { x: 0, y: 54, width: 91, height: 47 } },
    ],
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const MINOTAUR_MAX_HP = calculateMaxHp(100, 60, 5); // 400 HP

export const MINOTAUR: EnemyData = {
  id: 'minotaur',
  name: 'Minotaur',
  type: 'beast',
  stats: { pow: 16, vit: 60, spd: 15 },
  vitHpMultiplier: 5,
  maxHp: MINOTAUR_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/minotaur_sheet.png',
  admurinSheet: MINOTAUR_SHEET,
  spriteSize: 'lg',
  attackInterval: 3600, // ~3.13s after SPD — deliberate, devastating swings
  attackDamage: 22, // Base damage before POW modifier (29 after POW)
  guardBreak: 2, // A horned charge chews through the party Guard meter
  poise: 0.4, // A mountain of muscle — very hard to stagger
  rarityBias: 1, // A brute elite — slightly better odds at rarer gear
  expReward: calculateEnemyExpReward(MINOTAUR_MAX_HP), // 62
  lootTable: MINOTAUR_LOOT,
  attacks: [
    { name: 'Cleave', damageMultiplier: 1 },
    { name: 'Gore', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

MINOTAUR.currentHp = MINOTAUR.maxHp;
