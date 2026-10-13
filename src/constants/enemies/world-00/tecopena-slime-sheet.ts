import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const TECOPENA_SLIME_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/tecopena-slime_sheet.png',
  cellW: 64,
  cellH: 64,
  pixelated: true,
  animations: {
    idle: { row: 0, frames: 2, frameDurationMs: 220, source: 'idle', rect: { x: 22, y: 25, width: 20, height: 14 } },
    hurt: { row: 1, frames: 1, frameDurationMs: 320, source: 'hurt', rect: { x: 23, y: 22, width: 19, height: 17 } },
    attacks: [
      { row: 2, frames: 17, frameDurationMs: 60, source: 'attack1', rect: { x: 20, y: 13, width: 25, height: 26 } },
    ],
  },
};
