import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const noop = () => {};

export function shuffleArray(argArray: any[]) {
  // Durstenfeld shuffle array
  let array = argArray.slice(); // Copy the array, don't mutate the original
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
export function auxObjectMap(object: Record<string, any>, mapFn: (arg: any) => any): Record<string, any> {
  return Object.keys(object).reduce(function (result: any, key: any) {
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
