import type { Integer } from '~/types/number-types';

// random int in range
export function randIntInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// random float in range
export function randFloatInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getRandomlyVariedValue(baseValue: number, variance: number = 0) {
  // Only varies the number downwards
  if (variance === 0) {
    return baseValue;
  }
  if (baseValue - variance <= 0) {
    return randFloatInRange(0, baseValue);
  }
  return baseValue - variance + randFloatInRange(0, variance);
}

// Generate range (array)
export function generateRange(min: number, max: number) {
  min = Math.ceil(min) as Integer;
  max = Math.floor(max) as Integer;

  if (min > max) {
    throw new Error('RANGE ERROR: min must be less than or equal to max');
  }

  return Array.from({ length: max - min + 1 }, (_, i) => i + min);
}

// random int in range after time interval
export function randIntInRangeAfterTimeInterval(min: Integer, max: Integer, timeInterval: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(randIntInRange(min, max));
    }, timeInterval);
  });
}

export function betweenZeroAndOne(value: number, varName: string = 'variable'): number {
  if (value > 1) {
    console.warn(`${varName} must be a value between 0 and 1`);
    return 1;
  }
  if (value < 0) {
    console.warn(`${varName} must be a value between 0 and 1`);
    return 0;
  }
  return value;
}


/**
 * Subtracts two numbers and ensures the result is not less than a minimum value.
 * @param a The first number to subtract from.
 * @param b The number to subtract.
 * @param min The minimum value to ensure the result is not less than. Defaults to 0.
 * @returns The result of the subtraction, clamped to the minimum value.
 */
export function substractionWithMin(a: number, b: number, min: number = 0): number {
    return Math.max(a - b, min);
}

/**
 * Adds two numbers and ensures the result is not greater than a maximum value.
 * @param a The first number to add.
 * @param b The second number to add.
 * @param max The maximum value to ensure the result is not greater than.
 * @returns The result of the addition, clamped to the maximum value.
 */
export function additionWithMax(a: number, b: number, max: number): number {
    return Math.min(a + b, max);
}