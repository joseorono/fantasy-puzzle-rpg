import type { AdmurinEnemySheet } from '~/types/admurin-enemies';

export const FROGGER_SHEET: AdmurinEnemySheet = {
  image: '/assets/enemy-sprites/frogger_sheet.png',
  cellW: 384,
  cellH: 128,
  characterRect: { x: 156, y: 69, width: 72, height: 59 },
  animations: {
    idle: { row: 0, frames: 5, frameDurationMs: 140, source: 'idle' },
    move: { row: 1, frames: 8, frameDurationMs: 80, source: 'move' },
    hurt: { row: 2, frames: 4, frameDurationMs: 80, source: 'hurt' },
    attacks: [
      { row: 3, frames: 8, frameDurationMs: 70, source: 'tongue' },
      { row: 4, frames: 11, frameDurationMs: 70, source: 'spit' },
    ],
    ability: { row: 5, frames: 17, frameDurationMs: 80, source: 'heal' },
  },
};
