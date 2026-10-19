import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { ENCHANTED_GOLEM_LOOT } from './loot-tables';

// Rects are full cell height so every pose shares the same vertical anchor: the golem shrinks in
// place during attacks instead of riding up toward the top of the card.
export const ENCHANTED_GOLEM_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/enchanted-golem_sheet.png',
  cellW: 64,
  cellH: 64,
  pixelated: true,
  animations: {
    idle: { row: 0, frames: 4, frameDurationMs: 140, source: 'idle', rect: { x: 21, y: 0, width: 24, height: 64 } },
    hurt: { row: 1, frames: 6, frameDurationMs: 80, source: 'hurt', rect: { x: 23, y: 0, width: 18, height: 64 } },
    attacks: [
      { row: 2, frames: 8, frameDurationMs: 70, source: 'attack_a', rect: { x: 17, y: 0, width: 30, height: 64 } },
      { row: 3, frames: 8, frameDurationMs: 70, source: 'attack_b', rect: { x: 20, y: 0, width: 26, height: 64 } },
    ],
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
const ENCHANTED_GOLEM_MAX_HP = calculateMaxHp(60, 40, 5); // 260 HP

export const ENCHANTED_GOLEM: EnemyData = {
  id: 'enchanted-golem',
  name: 'Enchanted Golem',
  type: 'golem',
  stats: { pow: 14, vit: 40, spd: 10 },
  vitHpMultiplier: 5,
  maxHp: ENCHANTED_GOLEM_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/enchanted-golem_sheet.png',
  admurinSheet: ENCHANTED_GOLEM_SHEET,
  spriteSize: 'md',
  attackInterval: 4000, // ~3.64s after SPD — magic keeps the stone moving
  attackDamage: 16, // Base damage before POW modifier (20 after POW)
  guardBreak: 1.6, // Armoured hits chew through the party Guard meter
  poise: 0.5, // Enchanted stone — very hard to stagger
  rarityBias: 0,
  expReward: calculateEnemyExpReward(ENCHANTED_GOLEM_MAX_HP), // 45
  lootTable: ENCHANTED_GOLEM_LOOT,
  attacks: [
    { name: 'Strike', damageMultiplier: 1 },
    { name: 'Slam', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

ENCHANTED_GOLEM.currentHp = ENCHANTED_GOLEM.maxHp;
