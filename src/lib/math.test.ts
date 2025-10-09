import { expect, expectTypeOf, test } from 'vitest';
import zod from 'zod';

import * as math from './math';
import type { Integer } from '~/types/number-types';

test('Tests Work: adds 1 + 2 to equal 3', () => {
  const sum = (a: number, b: number) => a + b;

  expect(sum(1, 2)).toBe(3);
});

test('randIntInRange', () => {
  const result = math.randIntInRange(1, 2);

  expect(result).toBeGreaterThanOrEqual(1);
  expect(result).toBeLessThanOrEqual(2);
});

test('randFloatInRange', () => {
  const result = math.randFloatInRange(1, 2);

  expect(result).toBeGreaterThanOrEqual(1);
  expect(result).toBeLessThanOrEqual(2);
});

test('getRandomlyVariedValue', () => {
  const tries = 3;
  const result = math.getRandomlyVariedValue(1);

  expect(result).toBeGreaterThanOrEqual(0);
  expect(result).toBe(1);

  const resultWithVariance = math.getRandomlyVariedValue(1, 0.3);
  for (let i = 0; i < tries; i++) {
    expect(resultWithVariance).toBeLessThanOrEqual(1);
    expect(resultWithVariance).toBeGreaterThanOrEqual(0.7);
  }

  const resultWithVariance2 = math.getRandomlyVariedValue(1, 1.2);
  expect(resultWithVariance2).toBeLessThanOrEqual(1);
  expect(resultWithVariance2).toBeGreaterThanOrEqual(0);
});

test('generateRange', () => {
  const result = math.generateRange(1, 3);
  expect(result).toEqual([1, 2, 3]);

  expect(() => math.generateRange(3, 2)).toThrowError(/RANGE ERROR/);
});

test.skip('randIntInRangeAfterTimeInterval gives you an integer', async () => {
  const result = await math.randIntInRangeAfterTimeInterval(1 as Integer, 2 as Integer, 2000);

  expectTypeOf(result).toBeNumber();
  expect(result).toBeGreaterThanOrEqual(1);
  expect(result).toBeLessThanOrEqual(2);
});

test('betweenZeroAndOne is between zero and one', () => {
  const lowerThanZero = math.betweenZeroAndOne(-5);
  const higherThanOne = math.betweenZeroAndOne(5);
  const betweenZeroAndOne = math.betweenZeroAndOne(0.752133);

  expect(lowerThanZero).toEqual(0);
  expect(higherThanOne).toEqual(1);
  expect(betweenZeroAndOne).toEqual(0.752133);
});
