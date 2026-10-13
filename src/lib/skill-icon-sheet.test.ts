import { describe, it, expect } from 'vitest';
import {
  resolveSkillIconIndex,
  skillIconPosition,
  skillIconCellCount,
  describeSkillCellError,
} from './skill-icon-sheet';
import { SKILL_SHEETS, type SkillSheetConfig } from '~/constants/skill-icons';

const SHEETS = Object.values(SKILL_SHEETS) as SkillSheetConfig[];

/** Grid position of the last icon that actually exists in a sheet. */
function lastRealCell(config: SkillSheetConfig) {
  return skillIconPosition(config, config.iconCount - 1);
}

/** First in-grid cell past the last icon — the partially filled last row. */
function firstEmptyCell(config: SkillSheetConfig) {
  return skillIconPosition(config, config.iconCount);
}

describe('resolveSkillIconIndex', () => {
  it.each(SHEETS)('resolves the first cell of $slug', (config) => {
    expect(resolveSkillIconIndex(config, { row: 0, col: 0 })).toEqual({ ok: true, index: 0 });
  });

  it.each(SHEETS)('resolves the last real icon of $slug', (config) => {
    expect(resolveSkillIconIndex(config, lastRealCell(config))).toEqual({
      ok: true,
      index: config.iconCount - 1,
    });
  });

  it.each(SHEETS)('rejects the first empty cell in the last row of $slug', (config) => {
    expect(resolveSkillIconIndex(config, firstEmptyCell(config))).toEqual({
      ok: false,
      reason: 'past-last-icon',
    });
  });

  it.each(SHEETS)('rejects every empty tail cell of $slug', (config) => {
    for (let index = config.iconCount; index < skillIconCellCount(config); index++) {
      expect(resolveSkillIconIndex(config, skillIconPosition(config, index))).toEqual({
        ok: false,
        reason: 'past-last-icon',
      });
    }
  });

  it.each(SHEETS)('rejects positions past the grid of $slug', (config) => {
    expect(resolveSkillIconIndex(config, { row: config.rows, col: 0 })).toEqual({
      ok: false,
      reason: 'out-of-grid',
    });
    expect(resolveSkillIconIndex(config, { row: 0, col: config.cols })).toEqual({
      ok: false,
      reason: 'out-of-grid',
    });
    expect(resolveSkillIconIndex(config, { row: 99, col: 99 })).toEqual({
      ok: false,
      reason: 'out-of-grid',
    });
  });

  it.each(SHEETS)('rejects negative coordinates for $slug', (config) => {
    expect(resolveSkillIconIndex(config, { row: -1, col: 0 })).toEqual({
      ok: false,
      reason: 'negative',
    });
    expect(resolveSkillIconIndex(config, { row: 0, col: -1 })).toEqual({
      ok: false,
      reason: 'negative',
    });
  });

  it.each(SHEETS)('rejects fractional coordinates for $slug', (config) => {
    expect(resolveSkillIconIndex(config, { row: 2.5, col: 0 })).toEqual({
      ok: false,
      reason: 'not-integer',
    });
    expect(resolveSkillIconIndex(config, { row: 0, col: 0.1 })).toEqual({
      ok: false,
      reason: 'not-integer',
    });
    expect(resolveSkillIconIndex(config, { row: NaN, col: 0 })).toEqual({
      ok: false,
      reason: 'not-integer',
    });
    expect(resolveSkillIconIndex(config, { row: Infinity, col: 0 })).toEqual({
      ok: false,
      reason: 'not-integer',
    });
  });

  it.each(SHEETS)('maps every icon of $slug to a unique in-bounds cell', (config) => {
    const seen = new Set<string>();

    for (let index = 0; index < config.iconCount; index++) {
      const position = skillIconPosition(config, index);

      expect(position.row).toBeLessThan(config.rows);
      expect(position.col).toBeLessThan(config.cols);
      expect(resolveSkillIconIndex(config, position)).toEqual({ ok: true, index });

      const key = `${position.row},${position.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    expect(seen.size).toBe(config.iconCount);
  });

  it('reports the reason of the first failing check', () => {
    const config = SKILL_SHEETS['warrior-berserker'];

    // Negative and fractional at once — "not-integer" is checked first.
    expect(resolveSkillIconIndex(config, { row: -1.5, col: 0 })).toEqual({
      ok: false,
      reason: 'not-integer',
    });
    // Negative and out of grid at once — "negative" is checked first.
    expect(resolveSkillIconIndex(config, { row: -1, col: 999 })).toEqual({
      ok: false,
      reason: 'negative',
    });
  });
});

describe('skill sheet geometry', () => {
  it.each(SHEETS)('$slug holds its icons within its grid', (config) => {
    expect(config.iconCount).toBeLessThanOrEqual(skillIconCellCount(config));
    // Rows are tight: dropping one would not fit the icons.
    expect(config.iconCount).toBeGreaterThan((config.rows - 1) * config.cols);
  });
});

describe('describeSkillCellError', () => {
  const config = SKILL_SHEETS['warrior-berserker'];

  it('names the sheet and its capacity for an empty cell', () => {
    const message = describeSkillCellError(config, { row: 5, col: 9 }, 'past-last-icon');

    expect(message).toContain('warrior-berserker');
    expect(message).toContain('57');
    expect(message).toContain('row: 5');
    expect(message).toContain('col: 9');
  });

  it('names the grid for an out-of-grid cell', () => {
    expect(describeSkillCellError(config, { row: 9, col: 0 }, 'out-of-grid')).toContain('10x6');
  });
});
