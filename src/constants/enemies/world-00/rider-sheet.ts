import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const RIDER_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/rider_sheet.png',
  cellW: 64,
  cellH: 64,
  animations: {
    idle: { row: 0, frames: 7, frameDurationMs: 140, source: 'idle', rect: { x: 4, y: 12, width: 59, height: 51 } },
    move: { row: 1, frames: 7, frameDurationMs: 80, source: 'move', rect: { x: 4, y: 12, width: 59, height: 51 } },
    hurt: { row: 2, frames: 7, frameDurationMs: 80, source: 'hurt', rect: { x: 3, y: 12, width: 60, height: 51 } },
    attacks: [
      { row: 3, frames: 7, frameDurationMs: 70, source: 'attack_a', rect: { x: 3, y: 7, width: 54, height: 56 } },
      { row: 4, frames: 4, frameDurationMs: 70, source: 'attack_b', rect: { x: 9, y: 7, width: 50, height: 56 } },
    ],
  },
};
