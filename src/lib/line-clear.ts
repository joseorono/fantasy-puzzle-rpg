import type { LineOrientation, Orb } from '~/types/battle';
import type { CharacterData, OrbType } from '~/types/rpg-elements';
import type { MatchGroup } from './match-resolution';
import { expandBombExplosions } from './match-3';
import { LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT, LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT } from '~/constants/battle';
import type { Rng } from './board-generation';

/**
 * How many lines of the given orientation a board has — the range a line-clear index may address.
 *
 * @param board - The game board containing orbs
 * @param orientation - Whether lines run across rows or down columns
 * @returns The number of addressable lines
 */
export function getLineCount(board: Orb[][], orientation: LineOrientation): number {
  return orientation === 'row' ? board.length : (board[0]?.length ?? 0);
}

/**
 * Ids of every orb sitting on one row or column.
 *
 * @param board - The game board containing orbs
 * @param orientation - Whether to take a row or a column
 * @param index - Which row or column to take
 * @returns The orb ids on that line; empty when the index is out of range
 */
export function getLineOrbIds(board: Orb[][], orientation: LineOrientation, index: number): Set<string> {
  const ids = new Set<string>();
  if (index < 0 || index >= getLineCount(board, orientation)) return ids;

  if (orientation === 'row') {
    for (const orb of board[index]) ids.add(orb.id);
    return ids;
  }

  for (const row of board) ids.add(row[index].id);
  return ids;
}

/**
 * Every orb a line clear destroys: the line itself plus the 3x3 blast of any wildcard bomb caught
 * in it, chain-detonating exactly as a matched bomb does.
 *
 * @param board - The game board containing orbs
 * @param orientation - Whether to clear a row or a column
 * @param index - Which row or column to clear
 * @returns Ids of every destroyed orb; empty when the index is out of range
 */
export function resolveLineClearOrbs(board: Orb[][], orientation: LineOrientation, index: number): Set<string> {
  const line = getLineOrbIds(board, orientation, index);
  if (line.size === 0) return line;
  return expandBombExplosions(board, line);
}

/**
 * Groups destroyed orbs by colour so each one can pay out as its own match. Bombs are skipped:
 * they are wildcards with no colour of their own, and their blast orbs are already in the set.
 *
 * Counts are returned in board scan order (top-left to bottom-right, first seen first), matching
 * how the board picks the primary colour for a multi-colour match.
 *
 * @param board - The game board containing orbs
 * @param orbIds - Ids of the destroyed orbs
 * @returns One group per colour present, each with its orb count
 */
export function groupOrbsByColor(board: Orb[][], orbIds: ReadonlySet<string>): MatchGroup[] {
  const counts = new Map<OrbType, number>();

  for (const row of board) {
    for (const orb of row) {
      if (orb.isBomb || !orbIds.has(orb.id)) continue;
      counts.set(orb.type, (counts.get(orb.type) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([type, matchSize]) => ({ type, matchSize }));
}

/** Value of everything a candidate line would destroy, weighing what the party can actually use. */
function scoreLine(board: Orb[][], orbIds: ReadonlySet<string>, livingColors: ReadonlySet<OrbType>): number {
  let score = 0;

  for (const row of board) {
    for (const orb of row) {
      if (!orbIds.has(orb.id)) continue;
      if (orb.isBomb) {
        score += LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT;
      } else if (orb.type === 'gray') {
        score += LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT;
      } else if (livingColors.has(orb.type)) {
        score += 1;
      }
      // A dead hero's colour is worth nothing: no one is left to act on it.
    }
  }

  return score;
}

/**
 * Picks the line worth clearing most: bombs count heaviest (each takes a 3x3 with it), then orbs a
 * living hero can act on, then gray (Guard rather than damage); a dead hero's colour is worthless.
 *
 * Ties are broken uniformly at random by reservoir sampling, so a board of equivalent lines does not
 * always hand back the topmost one.
 *
 * @param board - The game board containing orbs
 * @param orientation - Whether to pick a row or a column
 * @param party - The current party, deciding which colours are worth anything
 * @param rng - Random source used only to break ties (defaults to `Math.random`)
 * @returns The index of the best line; 0 on an empty board
 */
export function pickBestLine(
  board: Orb[][],
  orientation: LineOrientation,
  party: CharacterData[],
  rng: Rng = Math.random,
): number {
  const livingColors = new Set<OrbType>();
  for (const char of party) if (char.currentHp > 0) livingColors.add(char.color);

  let bestIndex = 0;
  let bestScore = -Infinity;
  let tiedCount = 0;

  const lineCount = getLineCount(board, orientation);
  for (let index = 0; index < lineCount; index++) {
    const score = scoreLine(board, resolveLineClearOrbs(board, orientation, index), livingColors);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
      tiedCount = 1;
    } else if (score === bestScore) {
      tiedCount++;
      if (rng() < 1 / tiedCount) bestIndex = index;
    }
  }

  return bestIndex;
}
