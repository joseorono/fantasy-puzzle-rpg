import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const FROGGER_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/frogger_sheet.png',
  cellW: 384,
  cellH: 128,
  animations: {
    idle: { row: 0, frames: 5, frameDurationMs: 140, source: 'idle', rect: { x: 156, y: 69, width: 72, height: 59 } },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move', rect: { x: 132, y: 55, width: 121, height: 73 } },
    hurt: { row: 2, frames: 4, frameDurationMs: 80, source: 'hurt', rect: { x: 155, y: 67, width: 74, height: 61 } },
    attacks: [
      { row: 3, frames: 8, frameDurationMs: 70, source: 'tongue', rect: { x: 154, y: 65, width: 194, height: 63 } },
      { row: 4, frames: 11, frameDurationMs: 70, source: 'spit', rect: { x: 154, y: 65, width: 228, height: 63 } },
    ],
    ability: {
      row: 5,
      frames: 17,
      frameDurationMs: 80,
      source: 'heal',
      rect: { x: 154, y: 27, width: 88, height: 101 },
    },
  },
};
