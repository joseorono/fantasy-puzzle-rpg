import { expect, expectTypeOf, test } from 'vitest';

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

test('subtractionWithMin: Subtracts correctly', () => {
  const result = math.subtractionWithMin(10, 5);
  expect(result).toBe(5);
});

test('subtractionWithMin: Clamps to minimum value (default 0)', () => {
  const result = math.subtractionWithMin(5, 10);
  expect(result).toBe(0);
});

test('subtractionWithMin: Clamps to custom minimum value', () => {
  const result = math.subtractionWithMin(5, 10, 2);
  expect(result).toBe(2);
});

test('subtractionWithMin: Handles negative numbers', () => {
  const result1 = math.subtractionWithMin(-5, 3);
  expect(result1).toBe(0);

  const result2 = math.subtractionWithMin(-5, 3, -10);
  expect(result2).toBe(-8);
});

test('additionWithMax: Adds correctly', () => {
  const result = math.additionWithMax(5, 3, 10);
  expect(result).toBe(8);
});

test('additionWithMax: Clamps to maximum value', () => {
  const result = math.additionWithMax(5, 10, 12);
  expect(result).toBe(12);
});

test('additionWithMax: Handles exact maximum', () => {
  const result = math.additionWithMax(5, 5, 10);
  expect(result).toBe(10);
});

test('additionWithMax: Handles negative numbers', () => {
  const result1 = math.additionWithMax(-5, 3, 0);
  expect(result1).toBe(-2);

  const result2 = math.additionWithMax(-5, 10, 3);
  expect(result2).toBe(3);
});

test('multiplyDimensions: Scales dimensions by integer factor', () => {
  const result = math.multiplyDimensions(10, 10, 2);
  expect(result).toEqual([20, 20]);
});

test('multiplyDimensions: Scales dimensions by decimal factor with rounding', () => {
  const result1 = math.multiplyDimensions(10, 15, 1.5);
  expect(result1).toEqual([15, 23]);

  const result2 = math.multiplyDimensions(7, 9, 0.5);
  expect(result2).toEqual([4, 5]);
});

test('multiplyDimensions: Handles factor of 1 (no scaling)', () => {
  const result = math.multiplyDimensions(10, 20, 1);
  expect(result).toEqual([10, 20]);
});

test('multiplyDimensions: Handles factor of 0', () => {
  const result = math.multiplyDimensions(10, 20, 0);
  expect(result).toEqual([0, 0]);
});

test('multiplyDimensions: Rounds correctly for edge cases', () => {
  // 10 * 1.44 = 14.4 -> rounds to 14
  // 10 * 1.45 = 14.5 -> rounds to 15 (banker\'s rounding)
  const result1 = math.multiplyDimensions(10, 10, 1.44);
  expect(result1).toEqual([14, 14]);

  const result2 = math.multiplyDimensions(10, 10, 1.45);
  expect(result2).toEqual([15, 15]);

  const result3 = math.multiplyDimensions(10, 10, 1.46);
  expect(result3).toEqual([15, 15]);
});

test('multiplyDimensions: Handles different x and y values', () => {
  const result = math.multiplyDimensions(16, 9, 2.5);
  expect(result).toEqual([40, 23]);
});

test('multiplyDimensions: Handles negative dimensions', () => {
  const result = math.multiplyDimensions(-10, -20, 2);
  expect(result).toEqual([-20, -40]);
});

test('multiplyDimensions: Handles negative factor', () => {
  const result = math.multiplyDimensions(10, 20, -1.5);
  expect(result).toEqual([-15, -30]);
});
