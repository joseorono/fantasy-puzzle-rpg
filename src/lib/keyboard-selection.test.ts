import { describe, it, expect } from 'vitest';
import { nextSelectableIndex } from './keyboard-selection';

const enabled = { disabled: false };
const off = { disabled: true };

describe('nextSelectableIndex', () => {
  it('steps forward to the next enabled item', () => {
    expect(nextSelectableIndex([enabled, enabled, enabled], 0, 1)).toBe(1);
  });

  it('steps backward to the previous enabled item', () => {
    expect(nextSelectableIndex([enabled, enabled, enabled], 1, -1)).toBe(0);
  });

  it('wraps forward past the end', () => {
    expect(nextSelectableIndex([enabled, enabled, enabled], 2, 1)).toBe(0);
  });

  it('wraps backward past the start', () => {
    expect(nextSelectableIndex([enabled, enabled, enabled], 0, -1)).toBe(2);
  });

  it('skips a disabled item in the middle', () => {
    expect(nextSelectableIndex([enabled, off, enabled], 0, 1)).toBe(2);
  });

  it('skips a disabled item across the wrap boundary', () => {
    expect(nextSelectableIndex([off, enabled, enabled], 2, 1)).toBe(1);
    expect(nextSelectableIndex([enabled, enabled, off], 0, -1)).toBe(1);
  });

  it('reveals the first enabled item from fromIndex -1', () => {
    expect(nextSelectableIndex([enabled, enabled], -1, 1)).toBe(0);
    expect(nextSelectableIndex([off, enabled], -1, 1)).toBe(1);
  });

  it('reveals the last enabled item from fromIndex items.length', () => {
    expect(nextSelectableIndex([enabled, enabled], 2, -1)).toBe(1);
    expect(nextSelectableIndex([enabled, off], 2, -1)).toBe(0);
  });

  it('returns -1 when every item is disabled', () => {
    expect(nextSelectableIndex([off, off, off], 0, 1)).toBe(-1);
  });

  it('returns -1 for an empty list', () => {
    expect(nextSelectableIndex([], -1, 1)).toBe(-1);
  });

  it('lands back on a lone enabled item', () => {
    expect(nextSelectableIndex([enabled], 0, 1)).toBe(0);
    expect(nextSelectableIndex([enabled], 0, -1)).toBe(0);
  });
});
