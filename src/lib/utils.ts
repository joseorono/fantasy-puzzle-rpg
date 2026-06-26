import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const noop = () => {};

export function shuffleArray<T>(argArray: T[]) {
  // Durstenfeld shuffle array
  const array = argArray.slice(); // Copy the array, don't mutate the original
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function auxSleepFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.floor(ms)));
}

/**
 * Applies a function to each element of an object and returns a new object.
 *
 * @param {Record<string, any>} object - The object to map over.
 * @param {(arg: any) => any} mapFn - The function to apply to each element.
 * @returns {Record<string, any>} - A new object with the same keys as the input
 * object, but with the values transformed by the map function.
 */
export function auxObjectMap<T, U>(object: Record<string, T>, mapFn: (arg: T) => U): Record<string, U> {
  return Object.keys(object).reduce(function (result: Record<string, U>, key: string) {
    result[key] = mapFn(object[key]);
    return result;
  }, {});
}

export function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a random boolean based on the given probability of true.
 * @param probabilityOfTrue - A number between 0 and 1 representing the chance of returning true (e.g., 0.5 for 50% chance)
 * @returns A boolean value based on the probability
 */
export function randomBool(probabilityOfTrue: number): boolean {
  if (probabilityOfTrue < 0 || probabilityOfTrue > 1) {
    throw new Error('probabilityOfTrue must be between 0 and 1');
  }

  if (probabilityOfTrue === 0) {
    return false;
  }
  if (probabilityOfTrue === 1) {
    return true;
  }

  return Math.random() < probabilityOfTrue;
}

/**
 * Formats a level as a fixed-width, zero-padded string.
 * The game's level range is 1–99, so the default width is 2 (1 → "01", 99 → "99").
 * Values longer than `width` are returned unpadded (100 → "100").
 * @param level - Level to format (truncated to an integer).
 * @param width - Minimum digit count. Defaults to 2.
 * @returns Zero-padded level string.
 * @example
 * formatLevel(1) // "01"
 * formatLevel(42) // "42"
 * formatLevel(7, 3) // "007"
 */
export function formatLevel(level: number, width = 2): string {
  return Math.trunc(level).toString().padStart(width, '0');
}
