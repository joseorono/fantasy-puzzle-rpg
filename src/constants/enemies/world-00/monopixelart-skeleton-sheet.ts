import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const MONOPIXELART_SKELETON_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/monopixelart-skeleton_sheet.png',
  cellW: 96,
  cellH: 64,
  pixelated: true,
  animations: {
    idle: { row: 0, frames: 8, frameDurationMs: 140, source: 'Idle', rect: { x: 34, y: 18, width: 34, height: 46 } },
    move: { row: 1, frames: 10, frameDurationMs: 80, source: 'Walk', rect: { x: 31, y: 16, width: 39, height: 48 } },
    hurt: { row: 2, frames: 5, frameDurationMs: 80, source: 'Hurt', rect: { x: 30, y: 18, width: 38, height: 46 } },
    attacks: [
      { row: 3, frames: 10, frameDurationMs: 70, source: 'Attack1', rect: { x: 16, y: 16, width: 79, height: 48 } },
      { row: 4, frames: 9, frameDurationMs: 70, source: 'Attack2', rect: { x: 28, y: 17, width: 68, height: 47 } },
    ],
  },
};
