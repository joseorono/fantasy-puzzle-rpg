import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const TECOPENA_BAT_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/tecopena-bat_sheet.png',
  cellW: 64,
  cellH: 64,
  pixelated: true,
  animations: {
    idle: { row: 0, frames: 7, frameDurationMs: 90, source: 'idle', rect: { x: 11, y: 18, width: 48, height: 33 } },
    hurt: { row: 1, frames: 2, frameDurationMs: 120, source: 'hurt', rect: { x: 27, y: 20, width: 23, height: 30 } },
    attacks: [
      { row: 2, frames: 5, frameDurationMs: 80, source: 'attack1', rect: { x: 12, y: 18, width: 47, height: 27 } },
    ],
  },
};
