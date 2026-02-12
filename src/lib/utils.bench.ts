import { bench, describe } from 'vitest';
import { shuffleArray, getRandomElement, randomBool, auxObjectMap } from './utils';

const smallArray = [1, 2, 3, 4, 5];
const mediumArray = Array.from({ length: 100 }, (_, i) => i);
const largeArray = Array.from({ length: 1000 }, (_, i) => i);

const testObject = { a: 1, b: 2, c: 3, d: 4, e: 5 };
const doubler = (x: number) => x * 2;

describe('shuffleArray', () => {
  bench('5 elements', () => {
    shuffleArray(smallArray);
  });

  bench('100 elements', () => {
    shuffleArray(mediumArray);
  });

  bench('1000 elements', () => {
    shuffleArray(largeArray);
  });
});

describe('getRandomElement', () => {
  bench('from 5-element array', () => {
    getRandomElement(smallArray);
  });

  bench('from 1000-element array', () => {
    getRandomElement(largeArray);
  });
});

describe('randomBool', () => {
  bench('50% probability', () => {
    randomBool(0.5);
  });

  bench('guaranteed true', () => {
    randomBool(1);
  });

  bench('guaranteed false', () => {
    randomBool(0);
  });
});

describe('auxObjectMap', () => {
  bench('5-key object', () => {
    auxObjectMap(testObject, doubler);
  });
});
