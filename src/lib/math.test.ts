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

test('substractionWithMin: Subtracts correctly', () => {
  const result = math.substractionWithMin(10, 5);
  expect(result).toBe(5);
});

test('substractionWithMin: Clamps to minimum value (default 0)', () => {
  const result = math.substractionWithMin(5, 10);
  expect(result).toBe(0);
});

test('substractionWithMin: Clamps to custom minimum value', () => {
  const result = math.substractionWithMin(5, 10, 2);
  expect(result).toBe(2);
});

test('substractionWithMin: Handles negative numbers', () => {
  const result1 = math.substractionWithMin(-5, 3);
  expect(result1).toBe(0);

  const result2 = math.substractionWithMin(-5, 3, -10);
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
