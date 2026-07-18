import { expect, test, describe } from 'vitest';
import { normalizeForBitmap, GLYPH_FALLBACKS, formatLevel } from './text-utils';

describe('normalizeForBitmap', () => {
  test('returns supported text unchanged', () => {
    expect(normalizeForBitmap('Level Up')).toBe('Level Up');
    expect(normalizeForBitmap('Score: 12345')).toBe('Score: 12345');
    expect(normalizeForBitmap('')).toBe('');
  });

  test('replaces en and em dashes with a hyphen', () => {
    expect(normalizeForBitmap('Replay – combats')).toBe('Replay - combats');
    expect(normalizeForBitmap('Replay — combats')).toBe('Replay - combats');
  });

  test('expands an ellipsis to three dots', () => {
    expect(normalizeForBitmap('Loading…')).toBe('Loading...');
  });

  test('replaces every occurrence in a mixed string', () => {
    expect(normalizeForBitmap('a…b—c–d')).toBe('a...b-c-d');
  });

  test('preserves surrounding supported characters', () => {
    expect(normalizeForBitmap('HP—100')).toBe('HP-100');
  });

  test('is idempotent on already-normalized text', () => {
    const once = normalizeForBitmap('Wait… — done');
    expect(normalizeForBitmap(once)).toBe(once);
  });

  test('every fallback key maps to its ASCII value', () => {
    for (const [char, replacement] of Object.entries(GLYPH_FALLBACKS)) {
      expect(normalizeForBitmap(char)).toBe(replacement);
    }
  });
});

describe('formatLevel', () => {
  test('zero-pads single-digit levels to two digits', () => {
    expect(formatLevel(1)).toBe('01');
    expect(formatLevel(5)).toBe('05');
    expect(formatLevel(9)).toBe('09');
  });

  test('leaves two-digit levels unchanged', () => {
    expect(formatLevel(10)).toBe('10');
    expect(formatLevel(42)).toBe('42');
    expect(formatLevel(99)).toBe('99');
  });

  test('returns levels longer than the width unpadded', () => {
    expect(formatLevel(100)).toBe('100');
  });

  test('handles zero', () => {
    expect(formatLevel(0)).toBe('00');
  });

  test('truncates non-integer levels before padding', () => {
    expect(formatLevel(4.9)).toBe('04');
  });

  test('respects a custom width', () => {
    expect(formatLevel(7, 3)).toBe('007');
    expect(formatLevel(42, 4)).toBe('0042');
  });
});
