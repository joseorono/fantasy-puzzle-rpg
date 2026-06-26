import { expect, test, describe } from 'vitest';
import * as utils from './utils';

// shuffleArray Tests

test('shuffleArray: Return is same length', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = utils.shuffleArray(arr);
  expect(result.length).toBe(arr.length);
});

test('shuffleArray: Return is a permutation', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a'];
  const result = utils.shuffleArray(arr);
  expect(result.sort()).toEqual(arr.sort());
});

// getRandomElement
test('getRandomElement: Returns an element from the array', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = utils.getRandomElement(arr);
  expect(arr).toContain(result);
});

// auxObjectMap
test('auxObjectMap: Maps values of an object', () => {
  const obj = { a: 1, b: 2, c: 3 };
  const result = utils.auxObjectMap(obj, (x) => x * 2);
  expect(result).toEqual({ a: 2, b: 4, c: 6 });
});

// randomBool
describe('randomBool', () => {
  test('returns true when probability is 1', () => {
    expect(utils.randomBool(1)).toBe(true);
  });

  test('returns false when probability is 0', () => {
    expect(utils.randomBool(0)).toBe(false);
  });

  test('throws for out-of-range probability', () => {
    expect(() => utils.randomBool(-0.1)).toThrow();
    expect(() => utils.randomBool(1.1)).toThrow();
  });

  test('returns a boolean for valid probability', () => {
    const result = utils.randomBool(0.5);
    expect(typeof result).toBe('boolean');
  });
});

// formatLevel
describe('formatLevel', () => {
  test('zero-pads single-digit levels to two digits', () => {
    expect(utils.formatLevel(1)).toBe('01');
    expect(utils.formatLevel(5)).toBe('05');
    expect(utils.formatLevel(9)).toBe('09');
  });

  test('leaves two-digit levels unchanged', () => {
    expect(utils.formatLevel(10)).toBe('10');
    expect(utils.formatLevel(42)).toBe('42');
    expect(utils.formatLevel(99)).toBe('99');
  });

  test('returns levels longer than the width unpadded', () => {
    expect(utils.formatLevel(100)).toBe('100');
  });

  test('handles zero', () => {
    expect(utils.formatLevel(0)).toBe('00');
  });

  test('truncates non-integer levels before padding', () => {
    expect(utils.formatLevel(4.9)).toBe('04');
  });

  test('respects a custom width', () => {
    expect(utils.formatLevel(7, 3)).toBe('007');
    expect(utils.formatLevel(42, 4)).toBe('0042');
  });
});
