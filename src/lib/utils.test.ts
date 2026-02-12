import { expect, test, describe } from 'vitest';
import * as utils from './utils';

// shuffleArray Tests

test('shuffleArray: Return is same length', () => {
  let arr = [1, 2, 3, 4, 5];
  let result = utils.shuffleArray(arr);
  expect(result.length).toBe(arr.length);
});

test('shuffleArray: Return is a permutation', () => {
  let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a'];
  let result = utils.shuffleArray(arr);
  expect(result.sort()).toEqual(arr.sort());
});

// getRandomElement
test('getRandomElement: Returns an element from the array', () => {
  let arr = [1, 2, 3, 4, 5];
  let result = utils.getRandomElement(arr);
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
