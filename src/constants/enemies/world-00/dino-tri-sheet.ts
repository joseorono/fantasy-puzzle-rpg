import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

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
