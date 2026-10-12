import type { AdmurinEnemySheet } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';
import { calculateEnemyExpReward, calculateMaxHp } from '~/lib/rpg-calculations';
import { BADGER_LOOT } from './loot-tables';

export const BADGER_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/badger_sheet.png',
  cellW: 384,
  cellH: 128,
  animations: {
    idle: { row: 0, frames: 5, frameDurationMs: 140, source: 'idle', rect: { x: 139, y: 79, width: 105, height: 49 } },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move', rect: { x: 119, y: 56, width: 132, height: 72 } },
    hurt: { row: 2, frames: 4, frameDurationMs: 80, source: 'hurt', rect: { x: 139, y: 80, width: 105, height: 48 } },
    attacks: [
      { row: 3, frames: 15, frameDurationMs: 70, source: 'attack_A', rect: { x: 112, y: 55, width: 132, height: 73 } },
      { row: 4, frames: 11, frameDurationMs: 70, source: 'attack_B', rect: { x: 115, y: 60, width: 140, height: 68 } },
    ],
    ability: {
      row: 5,
      frames: 15,
      frameDurationMs: 80,
      source: 'ability',
      rect: { x: 139, y: 79, width: 105, height: 49 },
    },
  },
};

// HP is pulled out so `expReward` can be derived from it — see `calculateEnemyExpReward`.
// Area boss of the Fairy Forest, pitched at a level-10 party (~660 HP, ~25 DPS): ~50s to
// kill while it lands ~42 / ~67 per hit every ~3.3s — lethal without heals and Guard.
const BADGER_MAX_HP = calculateMaxHp(100, 90, 10);

export const BADGER: EnemyData = {
  id: 'badger',
  name: 'Badger',
  type: 'beast',
  stats: { pow: 20, vit: 90, spd: 10 },
  vitHpMultiplier: 10,
  maxHp: BADGER_MAX_HP,
  currentHp: 0, // Set to maxHp below, after the literal.
  sprite: '/assets/enemy-sprites/badger_sheet.png',
  admurinSheet: BADGER_SHEET,
  spriteSize: 'xl',
  attackInterval: 3600,
  attackDamage: 30,
  guardBreak: 1.6,
  poise: 0.6,
  rarityBias: 0.15,
  expReward: calculateEnemyExpReward(BADGER_MAX_HP),
  lootTable: BADGER_LOOT,
  attacks: [
    { name: 'Attack A', damageMultiplier: 1 },
    { name: 'Attack B', damageMultiplier: 1.6, guardBreakMultiplier: 1.5 },
  ],
};

BADGER.currentHp = BADGER.maxHp;
