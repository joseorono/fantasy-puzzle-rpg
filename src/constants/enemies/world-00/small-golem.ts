import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { SMALL_GOLEM_LOOT } from './loot-tables';

// Rects are full cell height so every pose shares the same vertical anchor: the golem shrinks in
// place during attacks instead of riding up toward the top of the card.
export const SMALL_GOLEM_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/small-golem_sheet.png',
  cellW: 64,
  cellH: 64,
  pixelated: true,
  animations: {
    // Sequences repeat the middle frames and run slower than the generated defaults: at speed the
    // little golem read as jerky. Idle ping-pongs so the loop never pops 3 -> 0.
    idle: {
      row: 0,
      frames: 4,
      frameDurationMs: 150,
      frameSequence: [0, 1, 2, 3, 2, 1],
      source: 'idle',
      rect: { x: 16, y: 0, width: 30, height: 64 },
    },
    hurt: {
      row: 1,
      frames: 9,
      frameDurationMs: 90,
      frameSequence: [0, 1, 2, 3, 4, 4, 5, 6, 7, 8],
      source: 'hurt',
      rect: { x: 17, y: 0, width: 30, height: 64 },
    },
    attacks: [
      {
        row: 2,
        frames: 9,
        frameDurationMs: 80,
        frameSequence: [0, 1, 2, 3, 4, 4, 4, 5, 6, 7, 8],
        source: 'attack_a',
        rect: { x: 16, y: 0, width: 31, height: 64 },
      },
      {
        row: 3,
        frames: 9,
        frameDurationMs: 80,
        frameSequence: [0, 1, 2, 3, 4, 4, 4, 5, 6, 7, 8],
        source: 'attack_b',
        rect: { x: 16, y: 0, width: 29, height: 64 },
      },
    ],
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const SMALL_GOLEM_MAX_HP = calculateMaxHp(40, 24, 5); // 160 HP

export const SMALL_GOLEM: EnemyData = {
  id: 'small-golem',
  name: 'Small Golem',
  type: 'golem',
  stats: { pow: 12, vit: 24, spd: 5 },
  vitHpMultiplier: 5,
  maxHp: SMALL_GOLEM_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/small-golem_sheet.png',
  admurinSheet: SMALL_GOLEM_SHEET,
  spriteSize: 'md',
  attackInterval: 4200, // ~4s after SPD — slow, deliberate rock hits
  attackDamage: 14, // Base damage before POW modifier (17 after POW)
  guardBreak: 1.5, // A rock body thumps the party Guard meter
  poise: 0.6, // Rocky — hits sink in without rocking it
  rarityBias: 0,
  expReward: calculateEnemyExpReward(SMALL_GOLEM_MAX_HP), // 32
  lootTable: SMALL_GOLEM_LOOT,
  attacks: [
    { name: 'Tackle', damageMultiplier: 1 },
    { name: 'Roll', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

SMALL_GOLEM.currentHp = SMALL_GOLEM.maxHp;
